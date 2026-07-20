const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ---- private calls ----
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PrivateChat",
      default: null,
    },
    // ---- group calls ----
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupSchema",
      default: null,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    // missed   -> caller never got picked up (timeout / cancelled before pickup)
    // rejected -> receiver explicitly declined
    // answered -> call connected, ended after being picked up
    status: {
      type: String,
      enum: ["missed", "rejected", "answered", "ended"],
      required: true,
    },
    duration: {
      type: Number, // seconds, 0 for missed/rejected
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);