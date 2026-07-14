const User = require("./../models/UserSchema");
const Group = require("./../models/GroupSchema");
const Message = require("./../models/MessageSchema");
const Report = require("./../models/ReportSchema");

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

