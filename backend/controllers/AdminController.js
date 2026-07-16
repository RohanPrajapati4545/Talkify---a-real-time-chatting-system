const User = require("./../models/UserSchema");
const Group = require("./../models/GroupSchema");
const Message = require("./../models/MessageSchema");
const Report = require("./../models/ReportSchema");
const GroupMessage = require("./../models/MessageSchema"); // ⚠️ confirm this model name/path
const PrivateChat = require("./../models/PrivateChatSchema");
const PrivateMessage = require("./../models/PrivateMessageSchema");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch users" });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch groups" });
  }
};

exports.getMessagesCount = async (req, res) => {
  try {
    const count = await Message.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch messages count" });
  }
};

exports.getReportedMessages = async (req, res) => {
  try {
    const reports = await Report.find({ status: "pending" })
      .populate("sender", "name image")
      .populate("message", "message")
      .sort({ createdAt: -1 });

    const formatted = reports.map((r) => ({
      _id: r._id,
      sender: r.sender,
      messageText: r.message ? r.message.message : "",
      reason: r.reason,
    }));

    res.status(200).json({ reports: formatted });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch reports" });
  }
};

exports.warnReport = async (req, res) => {
  try {
    const { reportId } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    report.status = "resolved";
    await report.save();

    res.status(200).json({ msg: "User warned" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to warn user" });
  }
};

exports.blockReport = async (req, res) => {
  try {
    const { reportId } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    // uses isBlocked to stay consistent with blockUser/unblockUser + frontend checks
    await User.findByIdAndUpdate(report.sender, { isBlocked: true });

    report.status = "resolved";
    await report.save();

    res.status(200).json({ msg: "User blocked" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to block user" });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    if (report.message) {
      await Message.findByIdAndUpdate(report.message, { isDeleted: true });
    }

    report.status = "resolved";
    await report.save();

    res.status(200).json({ msg: "Message deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to delete message" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Failed to update user" });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json({ user, msg: "User blocked" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to block user" });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json({ user, msg: "User unblocked" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to unblock user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndDelete(userId);

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json({ msg: "User deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to delete user" });
  }
};

// ============== GROUP MANAGEMENT (updated) ==============

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findByIdAndDelete(groupId);

    if (!group) return res.status(404).json({ msg: "Group not found" });

    await GroupMessage.deleteMany({ groupId: groupId });

    res.status(200).json({ msg: "Group deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to delete group" });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { groupId, groupName } = req.body;

    const updateData = {};
    if (groupName) updateData.groupName = groupName;
    if (req.file?.path) updateData.groupImage = req.file.path;

    const group = await Group.findByIdAndUpdate(groupId, updateData, { new: true });

    if (!group) return res.status(404).json({ msg: "Group not found" });

    res.status(200).json({ group, msg: "Group updated" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to update group" });
  }
};

// Remove a member from a group.
// If the removed member is the current admin (group.createdBy), the next
// member in the members array is automatically promoted to admin so the
// group always keeps an admin and is never deleted as a side effect.
// If the admin is the ONLY member left, the removal is rejected — the
// caller should add another member first or delete the group explicitly.
exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const isMember = group.members.some((m) => m.toString() === userId);
    if (!isMember) {
      return res.status(400).json({ msg: "User is not a member of this group" });
    }

    const wasAdmin = group.createdBy?.toString() === userId;

    group.members = group.members.filter((m) => m.toString() !== userId);

    if (wasAdmin) {
      if (group.members.length === 0) {
        return res.status(400).json({
          msg: "Cannot remove the only member. Add another member before removing the admin, or delete the group instead.",
        });
      }
      // promote the next member in line as the new admin
      group.createdBy = group.members[0];
    }

    await group.save();

    res.status(200).json({ group, msg: "Member removed from group" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to remove member" });
  }
};

// Manually transfer group adminship to any existing member.
// Admin status is derived purely from `createdBy`, so setting it to the
// new member automatically demotes the previous admin to a regular member —
// no separate role flag needs to be touched.
exports.changeGroupAdmin = async (req, res) => {
  try {
    const { groupId, newAdminId } = req.body;

    if (!newAdminId) {
      return res.status(400).json({ msg: "newAdminId is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const isMember = group.members.some((m) => m.toString() === newAdminId);
    if (!isMember) {
      return res.status(400).json({ msg: "Selected user is not a member of this group" });
    }

    if (group.createdBy?.toString() === newAdminId) {
      return res.status(400).json({ msg: "This user is already the group admin" });
    }

    group.createdBy = newAdminId;
    await group.save();

    res.status(200).json({ group, msg: "Group admin changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to change group admin" });
  }
};

// ============== GROUP CHAT MODERATION (new) ==============

exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await GroupMessage.find({ groupId: groupId })
      .populate("sender", "name image")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to fetch group messages" });
  }
};

exports.editGroupMessage = async (req, res) => {
  try {
    const { messageId, message } = req.body;

    const existing = await GroupMessage.findById(messageId);
    if (!existing) return res.status(404).json({ msg: "Message not found" });

    const updateData = {
      message,
      isEdited: true,
    };

    // If admin uploaded a new image/video/audio, replace the existing media
    if (req.file) {
      updateData.media = req.file.path;

      if (req.file.mimetype.startsWith("image")) {
        updateData.mediaType = "image";
      } else if (req.file.mimetype.startsWith("video")) {
        updateData.mediaType = "video";
      } else if (req.file.mimetype.startsWith("audio")) {
        updateData.mediaType = "audio";
      }
    }

    const updated = await GroupMessage.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    ).populate("sender", "name image");

    if (!updated) return res.status(404).json({ msg: "Message not found" });

    const io = req.app.get("io");
    if (io) io.to(updated.groupId.toString()).emit("groupMessageUpdated", updated);

    res.status(200).json({ message: updated, msg: "Message updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to update message" });
  }
};

exports.deleteGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.body;

    const deleted = await GroupMessage.findByIdAndDelete(messageId);

    if (!deleted) return res.status(404).json({ msg: "Message not found" });

    const io = req.app.get("io");
    if (io)
      io.to(deleted.groupId.toString()).emit("groupMessageDeleted", {
        _id: messageId,
        groupId: deleted.groupId,
      });

    res.status(200).json({ msg: "Message deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to delete message" });
  }
};

// Clears every message in a group's chat (admin moderation action)
exports.clearGroupChat = async (req, res) => {
  try {
    const { groupId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    await GroupMessage.deleteMany({ groupId: groupId });

    const io = req.app.get("io");
    if (io) io.to(groupId.toString()).emit("groupChatCleared", { groupId });

    res.status(200).json({ msg: "Chat cleared successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to clear chat" });
  }
};

// ============== PRIVATE (1-to-1) CHAT MODERATION (new) ==============

// All private conversations a particular user is part of
exports.getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await PrivateChat.find({ members: userId })
      .populate("members", "name email image isBlocked")
      .sort({ updatedAt: -1 });

    res.status(200).json({ chats });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to fetch user's chats" });
  }
};

// Messages inside one specific private chat
exports.getPrivateChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await PrivateMessage.find({ chatId })
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to fetch messages" });
  }
};

exports.editPrivateMessage = async (req, res) => {
  try {
    const { messageId, message } = req.body;

    const existing = await PrivateMessage.findById(messageId);
    if (!existing) return res.status(404).json({ msg: "Message not found" });

    const updateData = {
      message,
      isEdited: true,
    };

    if (req.file) {
      updateData.media = req.file.path;

      if (req.file.mimetype.startsWith("image")) {
        updateData.mediaType = "image";
      } else if (req.file.mimetype.startsWith("video")) {
        updateData.mediaType = "video";
      } else if (req.file.mimetype.startsWith("audio")) {
        updateData.mediaType = "audio";
      }
    }

    const updated = await PrivateMessage.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    )
      .populate("sender", "name image")
      .populate("receiver", "name image");

    if (!updated) return res.status(404).json({ msg: "Message not found" });

    const io = req.app.get("io");
    if (io) io.to(updated.chatId.toString()).emit("privateMessageUpdated", updated);

    res.status(200).json({ message: updated, msg: "Message updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to update message" });
  }
};

exports.deletePrivateMessage = async (req, res) => {
  try {
    const { messageId } = req.body;

    const deleted = await PrivateMessage.findByIdAndDelete(messageId);
    if (!deleted) return res.status(404).json({ msg: "Message not found" });

    const io = req.app.get("io");
    if (io)
      io.to(deleted.chatId.toString()).emit("privateMessageDeleted", {
        _id: messageId,
        chatId: deleted.chatId,
      });

    res.status(200).json({ msg: "Message deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to delete message" });
  }
};

// Clears every message in a private chat but keeps the chat itself
exports.clearPrivateChat = async (req, res) => {
  try {
    const { chatId } = req.body;

    const chat = await PrivateChat.findById(chatId);
    if (!chat) return res.status(404).json({ msg: "Chat not found" });

    await PrivateMessage.deleteMany({ chatId });

    const io = req.app.get("io");
    if (io) io.to(chatId.toString()).emit("privateChatCleared", { chatId });

    res.status(200).json({ msg: "Chat cleared successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to clear chat" });
  }
};

// Permanently deletes an entire private chat (messages + chat document)
exports.deletePrivateChatAdmin = async (req, res) => {
  try {
    const { chatId } = req.body;

    const chat = await PrivateChat.findById(chatId);
    if (!chat) return res.status(404).json({ msg: "Chat not found" });

    await PrivateMessage.deleteMany({ chatId });
    await PrivateChat.findByIdAndDelete(chatId);

    const io = req.app.get("io");
    if (io) io.to(chatId.toString()).emit("privateChatDeleted", { chatId });

    res.status(200).json({ msg: "Chat deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to delete chat" });
  }
};

exports.addGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const alreadyMember = group.members.some((m) => m.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ msg: "User is already a member of this group" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isBlocked) {
      return res.status(400).json({ msg: "Blocked users cannot be added to a group" });
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json({ group, msg: "Member added to group" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to add member" });
  }
};