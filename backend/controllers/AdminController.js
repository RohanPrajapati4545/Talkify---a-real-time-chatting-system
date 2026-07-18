const bcrypt = require("bcrypt"); // used by changePassword to verify/hash the admin's own password
const User = require("./../models/UserSchema");
const Group = require("./../models/GroupSchema");
const Message = require("./../models/MessageSchema");
const Report = require("./../models/ReportSchema");
const GroupMessage = require("./../models/MessageSchema"); // ⚠️ confirm this model name/path
const PrivateChat = require("./../models/PrivateChatSchema");
const PrivateMessage = require("./../models/PrivateMessageSchema");
exports.getAllUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const fetchAll = req.query.all === "true"; // used by lookup-map callers (e.g. AllGroups member resolution)

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (fetchAll) {
      const users = await User.find(query).select("-password").sort({ name: 1 });
      return res.status(200).json({ users });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch users" });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const query = {};
    if (search) {
      query.groupName = { $regex: search, $options: "i" };
    }

    const total = await Group.countDocuments(query);

    const groups = await Group.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      groups,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
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

// ============== ADMIN SELF PROFILE / SETTINGS (new — AdminProfile.jsx) ==============

// Updates the logged-in admin's own name/email/avatar.
// Uses the id from the verified token (req.user), NOT a userId in the body —
// an admin should only ever be able to edit their own profile through this route.
exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.user?.id || req.user?._id; // set by authMiddleware after verifying the JWT
    const { name, email } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (req.file?.path) updateData.image = req.file.path;

    const user = await User.findByIdAndUpdate(adminId, updateData, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ user, msg: "Profile updated successfully" });
  } catch (error) {
    console.log("updateProfile error:", error.message);
    console.log(error.stack);
    res.status(500).json({ msg: "Failed to update profile", detail: error.message });
  }
};

// Changes the logged-in admin's own password.
// Verifies the current password before allowing the change.
exports.changePassword = async (req, res) => {
  try {
    const adminId = req.user?.id || req.user?._id; // set by authMiddleware after verifying the JWT
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(adminId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to change password" });
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

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const io = req.app.get("io");

    // 1. Remove this user from every group they're a member of.
    //    - If they were the group admin, promote the next member.
    //    - If they were the ONLY member (and admin), delete the group
    //      entirely along with its messages.
    const groups = await Group.find({ members: userId });

    for (const group of groups) {
      group.members = group.members.filter((m) => m.toString() !== userId);

      const wasAdmin = group.createdBy?.toString() === userId;

      if (wasAdmin) {
        if (group.members.length === 0) {
          await GroupMessage.deleteMany({ groupId: group._id });
          await Group.findByIdAndDelete(group._id);
          if (io) io.to(group._id.toString()).emit("groupDeleted", { groupId: group._id });
          continue;
        }
        group.createdBy = group.members[0];
      }

      await group.save();
      if (io) io.to(group._id.toString()).emit("groupMemberRemoved", {
        groupId: group._id,
        userId,
        newCreatedBy: group.createdBy,
      });
    }

    // 2. Delete every group message this user ever sent (and notify any
    //    open group chat windows in real time).
    const userGroupMessages = await GroupMessage.find({ sender: userId });
    for (const msg of userGroupMessages) {
      await GroupMessage.findByIdAndDelete(msg._id);
      if (io)
        io.to(msg.groupId.toString()).emit("groupMessageDeleted", {
          _id: msg._id,
          groupId: msg.groupId,
        });
    }

    // 3. Delete every private chat this user was part of, along with all
    //    messages in those chats (notify any open chat windows too).
    const privateChats = await PrivateChat.find({ members: userId });
    for (const chat of privateChats) {
      await PrivateMessage.deleteMany({ chatId: chat._id });
      await PrivateChat.findByIdAndDelete(chat._id);
      if (io) io.to(chat._id.toString()).emit("privateChatDeleted", { chatId: chat._id });
    }

    // 4. Remove any reports this user filed (their reference would
    //    otherwise dangle too).
    await Report.deleteMany({ sender: userId });

    // 5. Finally, delete the user document itself.
    await User.findByIdAndDelete(userId);

    res.status(200).json({ msg: "User deleted" });
  } catch (error) {
    console.log(error);
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

// One-time (or as-needed) cleanup: strips any member IDs from every group
// that no longer correspond to an existing User document (e.g. leftover
// from user deletions that happened before cascade-cleanup was added to
// deleteUser). Also reassigns admin / deletes now-empty groups, same as
// the logic inside deleteUser.
exports.cleanupOrphanedGroupMembers = async (req, res) => {
  try {
    const allUserIds = new Set(
      (await User.find().select("_id")).map((u) => u._id.toString())
    );

    const groups = await Group.find();
    const io = req.app.get("io");

    let groupsFixed = 0;
    let groupsDeleted = 0;
    let membersRemoved = 0;

    for (const group of groups) {
      const originalCount = group.members.length;
      const validMembers = group.members.filter((m) => allUserIds.has(m.toString()));

      if (validMembers.length === originalCount) continue; // nothing orphaned here

      membersRemoved += originalCount - validMembers.length;
      group.members = validMembers;

      if (validMembers.length === 0) {
        await GroupMessage.deleteMany({ groupId: group._id });
        await Group.findByIdAndDelete(group._id);
        groupsDeleted++;
        if (io) io.to(group._id.toString()).emit("groupDeleted", { groupId: group._id });
        continue;
      }

      const creatorMissing = !allUserIds.has(group.createdBy?.toString());
      if (creatorMissing) {
        group.createdBy = validMembers[0];
      }

      await group.save();
      groupsFixed++;
      if (io)
        io.to(group._id.toString()).emit("groupMemberRemoved", {
          groupId: group._id,
          newCreatedBy: group.createdBy,
        });
    }

    res.status(200).json({
      msg: "Cleanup complete",
      groupsFixed,
      groupsDeleted,
      membersRemoved,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to clean up orphaned group members" });
  }
};