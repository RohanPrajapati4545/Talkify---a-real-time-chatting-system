const User = require("./../models/UserSchema");
const groupSchema = require("./../models/GroupSchema");
const Message = require("./../models/MessageSchema");

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const query = { _id: { $ne: req.user.id } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);

    const users = await User.find(query, "name email image")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      users,
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
      message: "Error fetching users",
    });
  }
};



const addUserToGroup = async (
  req,
  res
) => {
  try {
    const { groupId, userId } =
      req.body;

    const group =
      await groupSchema.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const alreadyMember =
      group.members.some(
        (member) =>
          member.toString() === userId
      );

    if (alreadyMember) {
      return res.status(400).json({
        message:
          "User already exists in group",
      });
    }
if (
  group.createdBy.toString() !==
  req.user.id.toString()
) {
  return res.status(403).json({
    message:
      "Only group admin can add members",
  });
}
    group.members.push(userId);

    await group.save();

  const updatedGroup =
  await groupSchema
    .findById(groupId)
    .populate("members", "name email image")
    .populate("createdBy", "_id name");

    // notify the newly added user (personal room — they haven't joined
    // this group's socket room yet) and existing members (already in it)
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("groupMembersUpdated", {
        groupId,
        group: updatedGroup,
      });
      io.to(groupId).emit("groupMembersUpdated", {
        groupId,
        group: updatedGroup,
      });
    }

    res.status(200).json({
      message:
        "User added successfully",
      group: updatedGroup,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "Error adding user to group",
    });
  }
};



const removeMember = async (
  req,
  res
) => {
  try {
    const { groupId, userId } =
      req.body;

    const group =
      await groupSchema.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }
if (
  group.createdBy.toString() !==
  req.user.id.toString()
) {
  return res.status(403).json({
    message:
      "Only group admin can remove members",
  });
}

    group.members =
      group.members.filter(
        (member) =>
          member.toString() !== userId
      );

    await group.save();

  const updatedGroup =
  await groupSchema
    .findById(groupId)
    .populate("members", "name email image")
    .populate("createdBy", "_id name");

    res.status(200).json({
      message:
        "Member removed successfully",
      group: updatedGroup,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "Error removing member",
    });
  }
};

const updateProfile = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name =
      req.body.name || user.name;

    // contact is sent as "phone" from the client, and email is
    // intentionally locked on the frontend — don't touch it here
    if (req.body.phone) {
      user.contact = req.body.phone;
    }

    if (req.file) {
      // new image uploaded — replace it
      user.image = req.file.path;
    } else if (req.body.removeImage === "true") {
      // user explicitly removed their photo — clear it instead of
      // silently keeping the old cloudinary URL
      user.image = null;
    }

    await user.save();

    res.status(200).json({
      message:
        "Profile updated successfully",
      user,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message:
        "Something went wrong",
    });
  }
};


// Leaving a group:
// - If the person leaving is NOT the admin, they're just removed from
//   `members` — nothing else changes.
// - If the person leaving IS the admin (createdBy) and other members are
//   still left, the next member in the array is automatically promoted
//   to admin so the group always keeps one.
// - If the admin was the only member left, the group has no reason to
//   exist anymore — it (and its messages) are deleted instead.
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;

    const group = await groupSchema.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const isMember = group.members.some(
      (member) => member.toString() === userId
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const wasAdmin = group.createdBy?.toString() === userId;

    group.members = group.members.filter(
      (member) => member.toString() !== userId
    );

    const io = req.app.get("io");

    // admin left and nobody's left behind — delete the group entirely
    if (wasAdmin && group.members.length === 0) {
      await Message.deleteMany({ groupId });
      await groupSchema.findByIdAndDelete(groupId);

      if (io) {
        io.to(groupId.toString()).emit("groupDeleted", { groupId });
      }

      return res.status(200).json({
        success: true,
        message:
          "You left the group. Since you were the last member, the group was deleted.",
        groupDeleted: true,
      });
    }

    // admin left but other members remain — promote the next one in line
    if (wasAdmin) {
      group.createdBy = group.members[0];
    }

    await group.save();

    const updatedGroup = await groupSchema
      .findById(groupId)
      .populate("members", "name email image")
      .populate("createdBy", "_id name image");

    if (io) {
      io.to(groupId.toString()).emit("groupMemberLeft", {
        groupId,
        userId,
        newCreatedBy: updatedGroup.createdBy,
        group: updatedGroup,
      });
    }

    res.status(200).json({
      success: true,
      message: wasAdmin
        ? `You left the group. ${
            updatedGroup.createdBy?.name || "The next member"
          } is now the admin.`
        : "You left the group successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};




module.exports = {
  addUserToGroup, getAllUsers, removeMember,updateProfile, leaveGroup
};