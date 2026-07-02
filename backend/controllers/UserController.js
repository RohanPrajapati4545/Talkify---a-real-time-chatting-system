const User = require("./../models/UserSchema");
const groupSchema=require("./../models/GroupSchema")
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.id } },
      "name email image"
    );

    res.status(200).json(users);
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

    user.email =
      req.body.email || user.email;

    if (req.file) {
      user.image = req.file.filename;
    }

    await user.save();

    res.status(200).json({
      message:
        "Profile updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Something went wrong",
    });
  }
};


const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    const group =
      await groupSchema.findByIdAndUpdate(
        groupId,
        {
          $pull: {
            members: req.user.id,
          },
        },
        { new: true }
      );

    res.status(200).json({
      success: true,
      message:
        "You left the group successfully",
      group,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: "Server Error",
    });
  }
};




module.exports = {
  addUserToGroup, getAllUsers, removeMember,updateProfile, leaveGroup
};