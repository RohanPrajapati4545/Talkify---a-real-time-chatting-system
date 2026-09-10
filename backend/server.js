const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const PrivateMessage = require("./models/PrivateMessageSchema")
const PrivateChatModel = require("./models/PrivateChatSchema");
const CallModel = require("./models/CallSchema");
require("./config/db");

const app = express();
const server = http.createServer(app);

// Dynamic CORS configuration allowing localhost, Vercel deployments, Render, and custom domains
const allowedOriginValidator = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, curl, server-to-server, health checks)
  if (!origin) return callback(null, true);

  const allowedPatterns = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.onrender\.com$/,
  ];

  const isMatched =
    allowedPatterns.some((pattern) => pattern.test(origin)) ||
    (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
    origin === "https://vercel.app";

  if (isMatched) {
    return callback(null, true);
  }

  // Fallback: allow any origin in production to avoid blocking live deployments
  return callback(null, true);
};

const corsOption = {
  origin: allowedOriginValidator,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200,
};

const io = new Server(server, {
  cors: {
    origin: allowedOriginValidator,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});
app.set("io", io);

app.use(cors(corsOption));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Root Health Check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Talkify API is live and running" });
});

mongoose.set("strictPopulate", false);

const onlineUsers = new Map();
const activeGroupCalls = new Map();

const addOnlineUser = (userId, socketId) => {
  const uid = userId?.toString();
  if (!uid) return;
  if (!onlineUsers.has(uid)) {
    onlineUsers.set(uid, new Set());
  }
  onlineUsers.get(uid).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  const uid = userId?.toString();
  if (!uid || !onlineUsers.has(uid)) return;

  onlineUsers.get(uid).delete(socketId);

  if (onlineUsers.get(uid).size === 0) {
    onlineUsers.delete(uid);
  }
};

const broadcastOnlineUsers = () => {
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
};

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  socket.on("userOnline", (userId) => {
    if (!userId) return;
    const uid = userId.toString();
    console.log(" JOINING ROOM:", `user_${uid}`, "socket:", socket.id);
    socket.join(`user_${uid}`);
    socket.userId = uid;
    addOnlineUser(uid, socket.id);
    broadcastOnlineUsers();
  });

  socket.on("userOffline", (userId) => {
    if (!userId) return;
    const uid = userId.toString();
    console.log(" USER OFFLINE (LOGOUT):", `user_${uid}`, "socket:", socket.id);
    onlineUsers.delete(uid);
    socket.userId = null;
    socket.leave(`user_${uid}`);
    broadcastOnlineUsers();
  });

  socket.on("joinGroup", (groupId) => {
    if (!groupId) return;
    const gid = groupId.toString();
    socket.join(gid);
    console.log(`${socket.id} joined Group ${gid}`);
  });

  socket.on("sendMessage", (msg) => {
    if (!msg) return;
    const gid = (msg.group?._id || msg.group || msg.groupId)?.toString();
    if (gid) {
      io.to(gid).emit("receiveMessage", msg);
    }
  });

  socket.on("groupMessageUpdated", (msg) => {
    if (!msg) return;
    const gid = (msg.group?._id || msg.group || msg.groupId)?.toString();
    if (gid) {
      io.to(gid).emit("groupMessageUpdated", msg);
    }
  });

  socket.on("groupMessageDeleted", (msg) => {
    if (!msg) return;
    const gid = (msg.group?._id || msg.group || msg.groupId)?.toString();
    if (gid) {
      io.to(gid).emit("groupMessageDeleted", msg);
    }
  });

  socket.on("groupMessagePinned", (data) => {
    if (!data) return;
    const gid = data.groupId?.toString();
    if (gid) {
      io.to(gid).emit("groupMessagePinned", data);
    }
  });

  socket.on("typing", ({ groupId, userId, userName }) => {
    if (groupId) {
      socket.to(groupId.toString()).emit("userTyping", { groupId, userId, userName });
    }
  });

  socket.on("stopTyping", ({ groupId, userId }) => {
    if (groupId) {
      socket.to(groupId.toString()).emit("userStopTyping", { groupId, userId });
    }
  });

  socket.on("joinPrivateChat", (chatId) => {
    if (!chatId) return;
    const cid = chatId.toString();
    socket.join(cid);
    console.log(`${socket.id} joined Private Chat ${cid}`);
  });

  socket.on("sendPrivateMessage", (msg) => {
    if (!msg) return;
    const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
    const senderId = (msg.sender?._id || msg.sender)?.toString();
    const chatId = (msg.chatId?._id || msg.chatId)?.toString();

    console.log(`[Socket] sendPrivateMessage from ${senderId} to ${receiverId} in chat ${chatId}`);

    // 1. Emit to the private chat room
    if (chatId) {
      io.to(chatId).emit("receivePrivateMessage", msg);
    }

    // 2. ALSO emit directly to user rooms to guarantee real-time delivery even if room wasn't pre-joined
    if (receiverId) {
      io.to(`user_${receiverId}`).emit("receivePrivateMessage", msg);
    }
    if (senderId) {
      io.to(`user_${senderId}`).emit("receivePrivateMessage", msg);
    }
  });

  socket.on("privateMessageUpdated", (msg) => {
    if (!msg) return;
    const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
    const senderId = (msg.sender?._id || msg.sender)?.toString();
    const chatId = (msg.chatId?._id || msg.chatId)?.toString();

    if (chatId) io.to(chatId).emit("privateMessageUpdated", msg);
    if (receiverId) io.to(`user_${receiverId}`).emit("privateMessageUpdated", msg);
    if (senderId) io.to(`user_${senderId}`).emit("privateMessageUpdated", msg);
  });

  socket.on("privateMessageDeleted", (msg) => {
    if (!msg) return;
    const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
    const senderId = (msg.sender?._id || msg.sender)?.toString();
    const chatId = (msg.chatId?._id || msg.chatId)?.toString();

    if (chatId) io.to(chatId).emit("privateMessageDeleted", msg);
    if (receiverId) io.to(`user_${receiverId}`).emit("privateMessageDeleted", msg);
    if (senderId) io.to(`user_${senderId}`).emit("privateMessageDeleted", msg);
  });

  socket.on("privateMessagePinned", (data) => {
    if (!data) return;
    const msg = data.message;
    const receiverId = (msg?.receiver?._id || msg?.receiver)?.toString();
    const senderId = (msg?.sender?._id || msg?.sender)?.toString();
    const chatId = (data.chatId?._id || data.chatId)?.toString();

    if (chatId) io.to(chatId).emit("privateMessagePinned", data);
    if (receiverId) io.to(`user_${receiverId}`).emit("privateMessagePinned", data);
    if (senderId) io.to(`user_${senderId}`).emit("privateMessagePinned", data);
  });

  socket.on("iceCandidate", ({ toUserId, signalData }) => {
    if (!toUserId) return;
    const uid = toUserId.toString();
    const room = io.sockets.adapter.rooms.get(`user_${uid}`);
    console.log("  RELAYING ICE CANDIDATE → to:", `user_${uid}`, "| sockets in room:", room ? room.size : 0, "| from socket:", socket.id);
    io.to(`user_${uid}`).emit("iceCandidate", { signalData });
  });

  socket.on("typingPrivate", ({ chatId, senderId, receiverId, userName }) => {
    const cId = chatId?.toString();
    const rId = receiverId?.toString();
    if (cId) socket.to(cId).emit("userTypingPrivate", { chatId: cId, senderId, receiverId: rId, userName });
    if (rId) socket.to(`user_${rId}`).emit("userTypingPrivate", { chatId: cId, senderId, receiverId: rId, userName });
  });

  socket.on("stopTypingPrivate", ({ chatId, senderId, receiverId }) => {
    const cId = chatId?.toString();
    const rId = receiverId?.toString();
    if (cId) socket.to(cId).emit("userStopTypingPrivate", { chatId: cId, senderId, receiverId: rId });
    if (rId) socket.to(`user_${rId}`).emit("userStopTypingPrivate", { chatId: cId, senderId, receiverId: rId });
  });

  socket.on("markPrivateMessageSeen", async ({ chatId, messageId, seenBy }) => {
    try {
      await PrivateMessage.findByIdAndUpdate(messageId, {
        seen: true,
        seenAt: new Date(),
      });

      const cid = chatId?.toString();
      if (cid) {
        io.to(cid).emit("privateMessagesSeen", {
          chatId: cid,
          seenBy,
          messageIds: [messageId],
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("groupSystemMessage", ({ groupId, message }) => {
    socket.to(groupId).emit("groupSystemMessage", { groupId, message });
  });

  socket.on("callUser", ({ toUserId, fromUser, signalData, callType }) => {
    const room = io.sockets.adapter.rooms.get(`user_${toUserId}`);
    console.log(" CALL USER — toUserId:", toUserId, "| sockets in room:", room ? room.size : 0);
    io.to(`user_${toUserId}`).emit("incomingCall", {
      fromUser,
      signalData,
      callType,
    });
  });

  socket.on("answerCall", ({ toUserId, signalData }) => {
    console.log("  ANSWER CALL — toUserId:", toUserId);
    io.to(`user_${toUserId}`).emit("callAccepted", { signalData });
  });

  socket.on("rejectCall", ({ toUserId }) => {
    io.to(`user_${toUserId}`).emit("callRejected");
  });

  socket.on("endCall", ({ toUserId }) => {
    io.to(`user_${toUserId}`).emit("callEnded");
  });

  socket.on("logCall", async ({ toUserId, callType, status, duration }) => {
    try {
      const fromUserId = socket.userId;
      if (!fromUserId || !toUserId) return;

      let chat = await PrivateChatModel.findOne({
        members: { $all: [fromUserId, toUserId] },
      });

      if (!chat) {
        chat = await PrivateChatModel.create({ members: [fromUserId, toUserId] });
      }

      const call = await CallModel.create({
        caller: fromUserId,
        receiver: toUserId,
        chatId: chat._id,
        callType,
        status,
        duration,
      });

      const populated = await CallModel.findById(call._id)
        .populate("caller", "name image")
        .populate("receiver", "name image");

      io.to(chat._id.toString())
        .to(`user_${fromUserId}`)
        .to(`user_${toUserId}`)
        .emit("callLogAdded", populated);

    } catch (err) {
      console.log("logCall error:", err);
    }
  });

  socket.on("groupCallUser", ({ groupId, groupName, groupImage, fromUser, callType }) => {
    console.log("GROUP CALL USER — groupId:", groupId, "from:", fromUser?._id);
    socket.to(groupId).emit("groupIncomingCall", {
      groupId,
      groupName,
      groupImage,
      fromUser,
      callType,
    });
  });

  socket.on("joinGroupCall", ({ groupId, userInfo }) => {
    if (!activeGroupCalls.has(groupId)) {
      activeGroupCalls.set(groupId, new Map());
    }
    const room = activeGroupCalls.get(groupId);

    const participants = Array.from(room.values()).map((p) => ({ userInfo: p.userInfo }));

    room.set(userInfo._id, { socketId: socket.id, userInfo });
    socket.join(`groupcall_${groupId}`);

    console.log("👥 JOIN GROUP CALL —", userInfo._id, "into", groupId, "| existing:", participants.length);

    socket.emit("groupCallParticipants", { groupId, participants });
    socket.to(`groupcall_${groupId}`).emit("groupUserJoinedCall", { groupId, userInfo });
  });

  socket.on("groupSignal", ({ groupId, toUserId, fromUser, signalData }) => {
    io.to(`user_${toUserId}`).emit("groupSignal", { groupId, fromUser, signalData });
  });

  socket.on("leaveGroupCall", ({ groupId, userId }) => {
    const room = activeGroupCalls.get(groupId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        activeGroupCalls.delete(groupId);
      }
    }
    socket.leave(`groupcall_${groupId}`);
    socket.to(`groupcall_${groupId}`).emit("groupUserLeftCall", { groupId, userId });
  });

  socket.on("logGroupCall", async ({ groupId, callType, duration }) => {
    try {
      const fromUserId = socket.userId;
      if (!fromUserId || !groupId) return;

      const call = await CallModel.create({
        caller: fromUserId,
        group: groupId,
        callType,
        status: "ended",
        duration,
      });

      const populated = await CallModel.findById(call._id).populate("caller", "name image");

      io.to(groupId).emit("groupCallLogAdded", populated);

    } catch (err) {
      console.log("logGroupCall error:", err);
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      removeOnlineUser(socket.userId, socket.id);
      broadcastOnlineUsers();
    }

    activeGroupCalls.forEach((room, groupId) => {
      for (const [uid, info] of room.entries()) {
        if (info.socketId === socket.id) {
          room.delete(uid);
          socket.to(`groupcall_${groupId}`).emit("groupUserLeftCall", { groupId, userId: uid });
          if (room.size === 0) {
            activeGroupCalls.delete(groupId);
          }
          break;
        }
      }
    });

    console.log("Disconnected:", socket.id);
  });

});

app.get("/api/debug-env", (req, res) => {
  const appName = process.env.METERED_APP_NAME || "MISSING";
  const key = process.env.METERED_API_KEY || "MISSING";

  res.json({
    appName,
    keyLength: key.length,
    keyPreview: key === "MISSING" ? "MISSING" : `${key.slice(0, 4)}...${key.slice(-4)}`,
  });
});

app.get("/api/turn-credentials", async (req, res) => {
  try {
    const response = await fetch(
      `https://${process.env.METERED_APP_NAME}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`
    );
    const iceServers = await response.json();
    res.json(iceServers);
  } catch (err) {
    console.log("TURN fetch error:", err);
    res.status(500).json({ message: "Could not fetch TURN credentials" });
  }
});

const AuthRoute = require("./routes/AuthRoute");
const GroupRoute = require("./routes/GroupRoute");
const UserRoute = require("./routes/UserRoute");
const PrivateChatRoute = require("./routes/PrivateChatRoute");
const AdminRoute = require("./routes/AdminRoute")
const ContactRoute = require("./routes/ContactRoute");
const homeContentRoutes = require("./routes/HomeContentRoute");
const aboutContentRoutes = require("./routes/AboutContentRoute");
const siteSettingsRoutes = require("./routes/SiteSettingRoute");
app.use("/api/auth", AuthRoute);
app.use("/api/user", GroupRoute);
app.use("/api/users", UserRoute);
app.use("/api/private", PrivateChatRoute);
app.use("/api/admin", AdminRoute)
app.use("/api/contact", ContactRoute);
app.use("/api/content", homeContentRoutes);
app.use("/api/content", aboutContentRoutes);
app.use("/api/content", siteSettingsRoutes);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});