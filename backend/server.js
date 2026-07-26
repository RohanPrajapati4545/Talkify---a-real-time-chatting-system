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

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
app.set("io", io);
const corsOption = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.CLIENT_URL,
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
app.use(cors(corsOption));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.set("strictPopulate", false);

const onlineUsers = new Map();
const activeGroupCalls = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) return;

  onlineUsers.get(userId).delete(socketId);

  if (onlineUsers.get(userId).size === 0) {
    onlineUsers.delete(userId);
  }
};

const broadcastOnlineUsers = () => {
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
};

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  socket.on("userOnline", (userId) => {
    console.log("🟢 JOINING ROOM:", `user_${userId}`);
    socket.join(`user_${userId}`);
    socket.userId = userId;
    addOnlineUser(userId, socket.id);
    broadcastOnlineUsers();
  });

  socket.on("userOffline", (userId) => {
    removeOnlineUser(userId, socket.id);
    socket.userId = null;
    broadcastOnlineUsers();
  });

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`${socket.id} joined Group ${groupId}`);
  });

  socket.on("sendMessage", (msg) => {
    io.to(msg.groupId).emit("receiveMessage", msg);
  });

  socket.on("groupMessageUpdated", (msg) => {
    io.to(msg.groupId).emit("groupMessageUpdated", msg);
  });

  socket.on("groupMessageDeleted", (msg) => {
    io.to(msg.groupId).emit("groupMessageDeleted", msg);
  });

  socket.on("typing", ({ groupId, userId, userName }) => {
    socket.to(groupId).emit("userTyping", { groupId, userId, userName });
  });

  socket.on("stopTyping", ({ groupId, userId }) => {
    socket.to(groupId).emit("userStopTyping", { groupId, userId });
  });

  socket.on("joinPrivateChat", (chatId) => {
    socket.join(chatId);
    console.log(`${socket.id} joined Private Chat ${chatId}`);
  });

  socket.on("sendPrivateMessage", (msg) => {
    const receiverId = msg.receiver?._id || msg.receiver;

    let target = io.to(msg.chatId);
    if (receiverId) target = target.to(`user_${receiverId}`);

    target.emit("receivePrivateMessage", msg);
  });

  socket.on("privateMessageUpdated", (msg) => {
    const receiverId = msg.receiver?._id || msg.receiver;

    let target = io.to(msg.chatId);
    if (receiverId) target = target.to(`user_${receiverId}`);

    target.emit("privateMessageUpdated", msg);
  });

  socket.on("privateMessageDeleted", (msg) => {
    const receiverId = msg.receiver?._id || msg.receiver;

    let target = io.to(msg.chatId);
    if (receiverId) target = target.to(`user_${receiverId}`);

    target.emit("privateMessageDeleted", msg);
  });

  socket.on("iceCandidate", ({ toUserId, signalData }) => {
    const room = io.sockets.adapter.rooms.get(`user_${toUserId}`);
    console.log("🧊 RELAYING ICE CANDIDATE → to:", `user_${toUserId}`, "| sockets in room:", room ? room.size : 0, "| from socket:", socket.id);
    io.to(`user_${toUserId}`).emit("iceCandidate", { signalData });
  });

  socket.on("typingPrivate", ({ chatId, senderId, receiverId, userName }) => {
    let target = socket.to(chatId);
    if (receiverId) target = target.to(`user_${receiverId}`);

    target.emit("userTypingPrivate", { chatId, senderId, receiverId, userName });
  });

  socket.on("stopTypingPrivate", ({ chatId, senderId, receiverId }) => {
    let target = socket.to(chatId);
    if (receiverId) target = target.to(`user_${receiverId}`);

    target.emit("userStopTypingPrivate", { chatId, senderId, receiverId });
  });

  socket.on("markPrivateMessageSeen", async ({ chatId, messageId, seenBy }) => {
    try {
      await PrivateMessage.findByIdAndUpdate(messageId, {
        seen: true,
        seenAt: new Date(),
      });

      io.to(chatId).emit("privateMessagesSeen", {
        chatId,
        seenBy,
        messageIds: [messageId],
      });
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("groupSystemMessage", ({ groupId, message }) => {
    socket.to(groupId).emit("groupSystemMessage", { groupId, message });
  });

  socket.on("callUser", ({ toUserId, fromUser, signalData, callType }) => {
    const room = io.sockets.adapter.rooms.get(`user_${toUserId}`);
    console.log("📞 CALL USER — toUserId:", toUserId, "| sockets in room:", room ? room.size : 0);
    io.to(`user_${toUserId}`).emit("incomingCall", {
      fromUser,
      signalData,
      callType,
    });
  });

  socket.on("answerCall", ({ toUserId, signalData }) => {
    console.log("✅ ANSWER CALL — toUserId:", toUserId);
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
    console.log("📞 GROUP CALL USER — groupId:", groupId, "from:", fromUser?._id);
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
const AdminRoute=require("./routes/AdminRoute")
const ContactRoute = require("./routes/ContactRoute");
const ContentRoute = require("./routes/Contentroute");  
app.use("/api/auth", AuthRoute);
app.use("/api/user", GroupRoute);
app.use("/api/users", UserRoute);
app.use("/api/private", PrivateChatRoute);
app.use("/api/admin",AdminRoute)
app.use("/api/contact", ContactRoute);
app.use("/api/content", ContentRoute);  
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});