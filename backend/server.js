const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const PrivateMessage =require("./models/PrivateMessageSchema")
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

// ── ONLINE USERS TRACKING ──────────────────────────────────────
const onlineUsers = new Map();

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

  // ── ONLINE STATUS ──────────────────────────────────────────
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

  // ── GROUP ──────────────────────────────────────────────────
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

  // 👇 NAYA — GROUP TYPING INDICATOR
  socket.on("typing", ({ groupId, userId, userName }) => {
    socket.to(groupId).emit("userTyping", { groupId, userId, userName });
  });

  socket.on("stopTyping", ({ groupId, userId }) => {
    socket.to(groupId).emit("userStopTyping", { groupId, userId });
  });

  // ── PRIVATE ────────────────────────────────────────────────
  socket.on("joinPrivateChat", (chatId) => {
    socket.join(chatId);
    console.log(`${socket.id} joined Private Chat ${chatId}`);
  });

  socket.on("sendPrivateMessage", (msg) => {
    io.to(msg.chatId).emit("receivePrivateMessage", msg);
  });

  socket.on("privateMessageUpdated", (msg) => {
    io.to(msg.chatId).emit("privateMessageUpdated", msg);
  });

  socket.on("privateMessageDeleted", (msg) => {
    io.to(msg.chatId).emit("privateMessageDeleted", msg);
  });

  // 👇 NAYA — PRIVATE TYPING INDICATOR
  socket.on("typingPrivate", ({ chatId, senderId, receiverId, userName }) => {
    socket.to(chatId).emit("userTypingPrivate", { chatId, senderId, receiverId, userName });
  });

  socket.on("stopTypingPrivate", ({ chatId, senderId, receiverId }) => {
    socket.to(chatId).emit("userStopTypingPrivate", { chatId, senderId, receiverId });
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

// ---- CALL SIGNALING ----

// Caller call start karta hai
socket.on("callUser", ({ toUserId, fromUser, signalData, callType }) => {
  // callType: "audio" | "video"

  io.to(`user_${toUserId}`).emit("incomingCall", {
    fromUser,          // { _id, name, image }
    signalData,        // WebRTC offer signal
    callType,
  });
});

// Receiver accept karta hai aur apna answer signal bhejta hai
socket.on("answerCall", ({ toUserId, signalData }) => {
  io.to(`user_${toUserId}`).emit("callAccepted", { signalData });
});

// Koi bhi side connect hone se pehle reject/cancel kare
socket.on("rejectCall", ({ toUserId }) => {
  io.to(`user_${toUserId}`).emit("callRejected");
});

// Koi bhi side call end kare
socket.on("endCall", ({ toUserId }) => {
  io.to(`user_${toUserId}`).emit("callEnded");
});

  // ── DISCONNECT ─────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (socket.userId) {
      removeOnlineUser(socket.userId, socket.id);
      broadcastOnlineUsers();
    }
    console.log("Disconnected:", socket.id);
  });

});

const AuthRoute = require("./routes/AuthRoute");
const GroupRoute = require("./routes/GroupRoute");
const UserRoute = require("./routes/UserRoute");
const PrivateChatRoute = require("./routes/PrivateChatRoute");

app.use("/api/auth", AuthRoute);
app.use("/api/user", GroupRoute);
app.use("/api/users", UserRoute);
app.use("/api/private", PrivateChatRoute);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});