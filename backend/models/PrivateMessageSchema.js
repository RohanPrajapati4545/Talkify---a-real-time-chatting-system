const mongoose = require("mongoose");

const PrivateMessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PrivateChat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    media: {
      type: String,
      default: "",
    },

    mediaType: {
      type: String,
      enum: ["image", "video", ""],
      default: "",
    },
    isEdited: {
  type: Boolean,
  default: false
},

isDeleted: {
  type: Boolean,
  default: false
},
   replyTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"PrivateMessage",
    default:null
},
seen: {
  type: Boolean,
  default: false,
},
seenAt: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PrivateMessage ||
  mongoose.model("PrivateMessage", PrivateMessageSchema);