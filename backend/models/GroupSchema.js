const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
    },

    groupImage: {
      type: String,
      default: "",
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true, 
    },
    inviteCode: {
  type: String,
  unique: true,
  default: () => uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase(),
}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Group", groupSchema);