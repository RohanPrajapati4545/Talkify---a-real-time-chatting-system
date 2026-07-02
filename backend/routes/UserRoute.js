const express = require("express");
const router = express.Router();
const upload=require("./../middlewares/upload")
const {
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require("./../controllers/blockController");
const UserController=require("./../controllers/UserController")
const AuthMiddleware=require("./../middlewares/authMiddleware")
router.get("/all-users",AuthMiddleware, UserController.getAllUsers);
router.put("/add-user",AuthMiddleware, UserController.addUserToGroup);
router.put( "/remove-member",AuthMiddleware, UserController.removeMember);
router.put( "/update-profile", AuthMiddleware,upload.single("image"), UserController.updateProfile);
router.put( "/leave-group", AuthMiddleware, UserController.leaveGroup);
router.put("/block/:userId", AuthMiddleware, blockUser);
router.put("/unblock/:userId", AuthMiddleware, unblockUser);
router.get("/blocked-users", AuthMiddleware, getBlockedUsers);
 
module.exports = router;