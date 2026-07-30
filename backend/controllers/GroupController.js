const GroupSchema = require("./../models/GroupSchema");
const User = require("./../models/UserSchema");
const Message = require("./../models/MessageSchema");
const PrivateChat = require("./../models/PrivateChatSchema");
const Call = require("./../models/CallSchema");
const { v4: uuidv4 } = require("uuid");

const createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;

    const memberEmails = members ? JSON.parse(members) : [];

    const memberIds = [];

    for (const email of memberEmails) {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: `${email} does not exist`,
          
        });
      }

      memberIds.push(user._id);
    }

 const group = await GroupSchema.create({
  groupName,
  groupImage: req.file ? req.file.path : "",
  members: [...memberIds, req.user.id],
  createdBy: req.user.id,
});

    const populatedGroup = await GroupSchema.findById(group._id)
      .populate("members", "name email image")
      .populate("createdBy", "_id name image");

    
    const io = req.app.get("io");
    if (io) {
      populatedGroup.members.forEach((m) => {
        io.to(`user_${m._id}`).emit("groupCreated", { group: populatedGroup });
      });
    }

    res.status(201).json({
      success: true,
      message: "Group Created Successfully",
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getMyGroup = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const baseQuery = {
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    };

    if (search) {
      baseQuery.groupName = { $regex: search, $options: "i" };
    }

    const total = await GroupSchema.countDocuments(baseQuery);

    const groups = await GroupSchema.find(baseQuery)
      .populate("members", "name email image")
      .populate("createdBy", "_id name")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const sendMessage = async (req, res) => {
  try {
    const { groupId, message, replyTo } = req.body;

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

    if (!message && !media) {
      return res.status(400).json({
        message: "Message or media is required",
      });
    }

    const msg = await Message.create({
      groupId,
      sender: req.user.id,
      message,
      media,
      mediaType,
      replyTo: replyTo || null
    });


    await GroupSchema.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    const populatedMsg = await Message.findById(msg._id)
      .populate("sender", "name image")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name image"
        }
      });

    res.status(201).json(populatedMsg);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
const getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const query = { groupId };
    if (search) {
      query.message = { $regex: search, $options: "i" };
    }

    const total = await Message.countDocuments(query);
 
    const messagesDesc = await Message.find(query)
      .populate("sender", "name image")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name image" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const messages = messagesDesc.reverse();

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//   NAYA — ek group ke saare call logs (chat thread me merge karne ke liye)
const getGroupCallLogs = async (req, res) => {
  try {
    const { groupId } = req.params;

    const calls = await Call.find({ group: groupId })
      .populate("caller", "name image")
      .sort({ createdAt: 1 });

    res.status(200).json({ calls });
  } catch (error) {
    res.status(500).json({ message: "Error fetching group call logs" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await GroupSchema.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (
      group.createdBy.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can delete group",
      });
    }

    await Message.deleteMany({
      groupId,
    });

    await GroupSchema.findByIdAndDelete(
      groupId
    );

    // notify everyone in the group's room (including the deleter's own
    // socket, since they're already joined) so all sidebars update live
    const io = req.app.get("io");
    if (io) io.to(groupId).emit("groupDeleted", { groupId });

    res.status(200).json({
      success: true,
      message:
        "Group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMessage = async (req, res) => {
  try {

    const msg = await Message.findById(req.params.id);

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

    msg.message = "This message was deleted";
    msg.media = "";
    msg.mediaType = "";
    msg.isDeleted = true;

    await msg.save();

    const updated = await Message.findById(msg._id)
      .populate("sender", "name image");

      const io = req.app.get("io");

io.to(updated.groupId.toString()).emit(
  "groupMessageDeleted",
  updated
);
    res.json(updated);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};
const updateMessage = async (req, res) => {
  try {

    const { message } = req.body;

    const msg = await Message.findById(req.params.id);
if (msg.isDeleted) {
  return res.status(400).json({
    message: "Deleted messages cannot be edited"
  });
}
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

    msg.message = message;
    msg.isEdited = true;

    await msg.save();

    const updated = await Message.findById(msg._id)
      .populate("sender", "name image");
      const io = req.app.get("io");

io.to(updated.groupId.toString()).emit(
  "groupMessageUpdated",
  updated
);



    res.json(updated);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};








const joinGroupByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;
 
    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" });
    }
 
    // case-insensitive match
    const group = await GroupSchema.findOne({
      inviteCode: inviteCode.toUpperCase().trim(),
    }).populate("members", "name image email")
      .populate("createdBy", "name image");
 
    if (!group) {
      return res.status(404).json({ message: "Invalid invite code. No group found." });
    }
 
    // already a member
    const alreadyMember = group.members.some(
      (m) => m._id.toString() === userId
    );
 
    if (alreadyMember) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }
 
    group.members.push(userId);
    await group.save();
 
    const updated = await GroupSchema.findById(group._id)
      .populate("members", "name image email")
      .populate("createdBy", "name image");

    // notify the new member (personal room — they haven't joined this
    // group's socket room yet) and existing members (already in the room)
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("groupMembersUpdated", {
        groupId: group._id,
        group: updated,
      });
      io.to(group._id.toString()).emit("groupMembersUpdated", {
        groupId: group._id,
        group: updated,
      });
    }
 
    res.status(200).json({
      message: `Successfully joined "${updated.groupName}"`,
      group: updated,
    });
 
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
 

const regenerateInviteCode = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
 
    const group = await GroupSchema.findById(groupId);
 
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
 
    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can regenerate the invite code" });
    }
 
    group.inviteCode = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
    await group.save();
 
    res.status(200).json({
      message: "Invite code regenerated",
      inviteCode: group.inviteCode,
    });
 
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { groupName } = req.body;

    const group = await GroupSchema.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // sirf admin (jisne group banaya) hi edit kar sake
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only admin can edit this group",
      });
    }

    if (groupName && groupName.trim()) {
      group.groupName = groupName.trim();
    }

    if (req.file) {
      group.groupImage = req.file.path;
    }

    await group.save();

    const updated = await GroupSchema.findById(group._id)
      .populate("members", "name email image")
      .populate("createdBy", "_id name");

    res.status(200).json({
      message: "Group updated successfully",
      group: updated,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


const clearGroupChat = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await GroupSchema.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only admin can clear this chat",
      });
    }

    await Message.deleteMany({ groupId });

    const io = req.app.get("io");
    io.to(groupId).emit("groupChatCleared", { groupId });

    res.status(200).json({ message: "Chat cleared successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getMyGroup, sendMessage, getMessages,  deleteGroup,updateMessage,deleteMessage, joinGroupByCode,updateGroup,clearGroupChat,
  regenerateInviteCode, getGroupCallLogs};