const User = require("./../models/UserSchema");
const Group = require("./../models/GroupSchema");
const Message = require("./../models/MessageSchema");
const Report = require("./../models/ReportSchema");
const GroupMessage = require("./../models/MessageSchema"); // ⚠️ confirm this model name/path

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

    await User.findByIdAndUpdate(report.sender, { isBanned: true });

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

// ============== GROUP MANAGEMENT (new) ==============

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findByIdAndDelete(groupId);

    if (!group) return res.status(404).json({ msg: "Group not found" });

    // optional: also clean up messages belonging to this group
    await GroupMessage.deleteMany({ group: groupId });

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

exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } },
      { new: true }
    );

    if (!group) return res.status(404).json({ msg: "Group not found" });

    res.status(200).json({ group, msg: "Member removed from group" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to remove member" });
  }
};

// ============== GROUP CHAT MODERATION (new) ==============

exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await GroupMessage.find({ group: groupId })
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

    const updated = await GroupMessage.findByIdAndUpdate(
      messageId,
      { message, isEdited: true },
      { new: true }
    ).populate("sender", "name image");

    if (!updated) return res.status(404).json({ msg: "Message not found" });

    // notify connected clients in that group in real-time
    const io = req.app.get("io");
    if (io) io.to(updated.group.toString()).emit("groupMessageUpdated", updated);

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
      io.to(deleted.group.toString()).emit("groupMessageDeleted", {
        _id: messageId,
        groupId: deleted.group,
      });

    res.status(200).json({ msg: "Message deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to delete message" });
  }
};