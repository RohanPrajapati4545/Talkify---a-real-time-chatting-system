const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    
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
       
   group: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Group",   
  default: null,
},
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
   
    status: {
      type: String,
      enum: ["missed", "rejected", "answered", "ended"],
      required: true,
    },
    duration: {
      type: Number,  
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", CallSchema);