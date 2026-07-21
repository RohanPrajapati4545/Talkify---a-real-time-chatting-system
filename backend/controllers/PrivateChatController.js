const mongoose = require("mongoose"); // 👈 NAYA — aggregate ke liye chahiye
const PrivateChat = require("./../models/PrivateChatSchema");
const User = require("./../models/UserSchema");
const Call = require("./../models/CallSchema");

const openPrivateChat = async (req, res) => {

  try {
    const { userId } = req.body;

    const myId = req.user.id;

    let chat = await PrivateChat.findOne({
      members: {
        $all: [myId, userId],
      },
    });

    if (!chat) {
      chat = await PrivateChat.create({
        members: [myId, userId],
      });
    }

    chat = await PrivateChat.findById(chat._id)
      .populate("members", "name image email");

    res.status(200).json(chat);

  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};




const getMyChats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = { members: req.user.id };
    const total = await PrivateChat.countDocuments(query);

    const chats = await PrivateChat.find(query)
      .populate("members", "name email image")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      chats,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👇 NAYA — logged-in user ke liye har sender se aaye unseen messages ka count
// response format: { "<senderId>": count, "<senderId2>": count, ... }
const getUnreadCounts = async (req, res) => {
  try {

    const myId = req.user.id || req.user._id; 
    const counts = await PrivateMessage.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(req.user.id),
          seen: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    counts.forEach((c) => {
      result[c._id.toString()] = c.count;
    });

    res.status(200).json(result);

  } catch (error) {
     console.log("getUnreadCounts error:", error); 
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};



const PrivateMessage = require("../models/PrivateMessageSchema");
const getPrivateMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const query = { chatId };
    if (search) {
      query.message = { $regex: search, $options: "i" };
    }

    const total = await PrivateMessage.countDocuments(query);

    const messagesDesc = await PrivateMessage.find(query)
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name image" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const messages = messagesDesc.reverse();

    // sirf isi page (fetch hue) messages me se, jo unseen hain aur receiver main hoon, unhe seen mark karo
    const unseenIds = messages
      .filter(
        (m) =>
          m.receiver?._id?.toString() === req.user.id &&
          !m.seen
      )
      .map((m) => m._id);

    if (unseenIds.length > 0) {
      await PrivateMessage.updateMany(
        { _id: { $in: unseenIds } },
        { $set: { seen: true, seenAt: new Date() } }
      );

      messages.forEach((m) => {
        if (unseenIds.some((id) => id.toString() === m._id.toString())) {
          m.seen = true;
        }
      });

      const io = req.app.get("io");
      io.to(chatId).emit("privateMessagesSeen", {
        chatId,
        seenBy: req.user.id,
        messageIds: unseenIds.map((id) => id.toString()),
      });
    }

    res.status(200).json({
      messages,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
};


const getCallLogs = async (req, res) => {
  try {
    const { chatId } = req.params;

    const calls = await Call.find({ chatId })
      .populate("caller", "name image")
      .populate("receiver", "name image")
      .sort({ createdAt: 1 });

    res.status(200).json({ calls });
  } catch (error) {
    res.status(500).json({ message: "Error fetching call logs" });
  }
};


const sendPrivateMessage = async (req, res) => {


  try {
    const { chatId, receiverId, message, replyTo } = req.body;

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const senderBlockedReceiver = sender.blockedUsers.some(
      (id) => id.toString() === receiverId
    );

    const receiverBlockedSender = receiver.blockedUsers.some(
      (id) => id.toString() === req.user.id
    );

    if (senderBlockedReceiver) {
      return res.status(403).json({
        message: "You have blocked this user. Unblock to send a message.",
      });
    }

    if (receiverBlockedSender) {
      return res.status(403).json({
        message: "You cannot message this user",
      });
    }
  
console.log("req.file:", req.file);
let media = "";
let mediaType = "";

if (req.file) {
  media = req.file.path;

  if (req.body.isVoice === "true") {
    mediaType = "audio";                            
  } else if (req.file.mimetype.startsWith("image")) {
    mediaType = "image";
  } else if (req.file.mimetype.startsWith("video")) {
    mediaType = "video";
  } else if (req.file.mimetype.startsWith("audio")) {
    mediaType = "audio";
  }
}
const msg = await PrivateMessage.create({
  chatId,
  sender: req.user.id,
  receiver: receiverId,
  message: message || "",
  media,
  mediaType,         
  replyTo: replyTo || null
});

    await PrivateChat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

    const populated = await PrivateMessage.findById(msg._id)
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name image"
        }
      });

    res.status(201).json(populated);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error sending private message" });
  }
};

const deleteMessage = async (req, res) => {
  try {

    const msg = await PrivateMessage.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (msg.sender.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    msg.message = "This message was deleted";
    msg.media = "";
    msg.mediaType = "";
    msg.isDeleted = true;

    await msg.save();

  const updated = await PrivateMessage.findById(msg._id)
.populate("sender","name image")
.populate("receiver","name image");
const io = req.app.get("io");

io.to(updated.chatId.toString()).emit(
  "privateMessageDeleted",
  updated
);



    res.json(updated);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

const updateMessage = async (req, res) => {

  try {

    const msg = await PrivateMessage.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    if (msg.sender.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not allowed"
      });
    }

    msg.message = req.body.message;
    msg.isEdited = true;

    await msg.save();

const updated = await PrivateMessage.findById(msg._id)
.populate("sender","name image")
.populate("receiver","name image");

const io = req.app.get("io");

io.to(updated.chatId.toString()).emit(
  "privateMessageUpdated",
  updated
);

res.json(updated);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};




const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await PrivateChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // sirf chat ke members hi delete kar sakein
    const isMember = chat.members.some(
      (m) => m.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // saare messages aur chat doc dono delete karo
    await PrivateMessage.deleteMany({ chatId });
    await PrivateChat.findByIdAndDelete(chatId);

    const io = req.app.get("io");
    io.to(chatId).emit("privateChatDeleted", { chatId });

    res.status(200).json({
      message: "Chat deleted successfully",
      chatId,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  openPrivateChat, getPrivateMessages, sendPrivateMessage, deleteMessage, updateMessage, deleteChat,
  getMyChats, getUnreadCounts, getCallLogs,
};