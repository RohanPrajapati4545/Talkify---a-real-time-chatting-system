const express = require("express")
const router = express.Router()
const upload = require("./../middlewares/upload")

const AuthController = require("./../controllers/AuthController")
const adminMiddleware = require("./../middlewares/adminMiddleware")
const authMiddleware = require("../middlewares/authMiddleware")
const AdminController = require("./../controllers/AdminController")

// dashboard / users
router.get("/get-all-user", authMiddleware, adminMiddleware, (AdminController.getAllUsers));
router.get("/get-messages-count", authMiddleware, adminMiddleware, (AdminController.getMessagesCount));
router.get("/get-reported-messages", authMiddleware, adminMiddleware, (AdminController.getReportedMessages));
router.post("/warn-report", authMiddleware, adminMiddleware, (AdminController.warnReport));
router.post("/block-report", authMiddleware, adminMiddleware, (AdminController.blockReport));
router.post("/delete-report", authMiddleware, adminMiddleware, (AdminController.deleteReport));
router.get("/get-user/:id", authMiddleware, adminMiddleware, (AdminController.getUserById));
router.post("/update-user", authMiddleware, adminMiddleware, (AdminController.updateUser));
router.post("/block-user", authMiddleware, adminMiddleware, (AdminController.blockUser));
router.post("/unblock-user", authMiddleware, adminMiddleware, (AdminController.unblockUser));
router.post("/delete-user", authMiddleware, adminMiddleware, (AdminController.deleteUser));

// groups
router.get("/get-all-group", authMiddleware, adminMiddleware, (AdminController.getAllGroups));
router.post("/delete-group", authMiddleware, adminMiddleware, (AdminController.deleteGroup));
router.post("/update-group", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.updateGroup));
router.post("/remove-group-member", authMiddleware, adminMiddleware, (AdminController.removeGroupMember));

// group chat moderation
router.get("/get-group-messages/:groupId", authMiddleware, adminMiddleware, (AdminController.getGroupMessages));
router.post("/edit-group-message", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.editGroupMessage));
router.post("/delete-group-message", authMiddleware, adminMiddleware, (AdminController.deleteGroupMessage));
router.post("/clear-group-chat", authMiddleware, adminMiddleware, (AdminController.clearGroupChat));

module.exports = router