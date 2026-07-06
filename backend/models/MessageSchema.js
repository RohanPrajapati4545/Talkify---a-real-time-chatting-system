const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
     groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
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
    isDeleted: {
  type: Boolean,
  default: false,
},

isEdited: {
  type: Boolean,
  default: false,
},
replyTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null
},

isSystem: {
  type: Boolean,
  default: false,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Message",
  MessageSchema
);