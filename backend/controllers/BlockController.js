const User = require("./../models/UserSchema"); 
 
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;

    if (userId === myId) {
      return res.status(400).json({
        message: "You cannot block yourself",
      });
    }

    const me = await User.findById(myId);

    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyBlocked = me.blockedUsers.some(
      (id) => id.toString() === userId
    );

    if (alreadyBlocked) {
      return res.status(400).json({
        message: "User already blocked",
      });
    }

    me.blockedUsers.push(userId);
    await me.save();

    res.status(200).json({
      message: "User blocked",
      blockedUsers: me.blockedUsers,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

 
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;

    const me = await User.findById(myId);

    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }

    me.blockedUsers = me.blockedUsers.filter(
      (id) => id.toString() !== userId
    );

    await me.save();

    res.status(200).json({
      message: "User unblocked",
      blockedUsers: me.blockedUsers,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

 
const getBlockedUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate(
      "blockedUsers",
      "name email image"
    );

    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(me.blockedUsers);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
};