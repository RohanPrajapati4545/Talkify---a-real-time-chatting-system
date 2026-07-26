const express = require("express")
const router = express.Router()
const upload = require("./../middlewares/upload")

const AuthController = require("./../controllers/AuthController")
const adminMiddleware = require("./../middlewares/adminMiddleware")
const authMiddleware = require("../middlewares/authMiddleware")
const AdminController = require("./../controllers/AdminController")
const ContentController = require("../controllers/ContentController")

// dashboard / users
router.get("/get-all-user", authMiddleware, adminMiddleware, (AdminController.getAllUsers));
router.get("/get-messages-count", authMiddleware, adminMiddleware, (AdminController.getMessagesCount));
router.get("/get-reported-messages", authMiddleware, adminMiddleware, (AdminController.getReportedMessages));
router.post("/warn-report", authMiddleware, adminMiddleware, (AdminController.warnReport));
router.post("/block-report", authMiddleware, adminMiddleware, (AdminController.blockReport));
router.post("/delete-report", authMiddleware, adminMiddleware, (AdminController.deleteReport));
router.get("/get-user/:id", authMiddleware, adminMiddleware, (AdminController.getUserById));
router.post("/update-user", authMiddleware, upload.single("image"), AdminController.updateUser);
router.post("/block-user", authMiddleware, adminMiddleware, (AdminController.blockUser));
router.post("/unblock-user", authMiddleware, adminMiddleware, (AdminController.unblockUser));
router.post("/delete-user", authMiddleware, adminMiddleware, (AdminController.deleteUser));

// admin's own profile / settings (AdminProfile.jsx)
router.post("/update-profile", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.updateProfile));
router.post("/change-password", authMiddleware, adminMiddleware, (AdminController.changePassword));

// groups
router.get("/get-all-group", authMiddleware, adminMiddleware, (AdminController.getAllGroups));
router.post("/delete-group", authMiddleware, adminMiddleware, (AdminController.deleteGroup));
router.post("/update-group", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.updateGroup));
router.post("/remove-group-member", authMiddleware, adminMiddleware, (AdminController.removeGroupMember));
router.post("/change-group-admin", authMiddleware, adminMiddleware, (AdminController.changeGroupAdmin));

// group chat moderation
router.get("/get-group-messages/:groupId", authMiddleware, adminMiddleware, (AdminController.getGroupMessages));
router.post("/edit-group-message", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.editGroupMessage));
router.post("/delete-group-message", authMiddleware, adminMiddleware, (AdminController.deleteGroupMessage));
router.post("/clear-group-chat", authMiddleware, adminMiddleware, (AdminController.clearGroupChat));

// private (1-to-1) chat moderation
router.get("/get-user-chats/:userId", authMiddleware, adminMiddleware, (AdminController.getUserChats));
router.get("/get-private-messages/:chatId", authMiddleware, adminMiddleware, (AdminController.getPrivateChatMessages));
router.post("/edit-private-message", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.editPrivateMessage));
router.post("/delete-private-message", authMiddleware, adminMiddleware, (AdminController.deletePrivateMessage));
router.post("/clear-private-chat", authMiddleware, adminMiddleware, (AdminController.clearPrivateChat));
router.post("/delete-private-chat", authMiddleware, adminMiddleware, (AdminController.deletePrivateChatAdmin));
router.post("/add-group-member", authMiddleware, adminMiddleware, (AdminController.addGroupMember));
router.post("/cleanup-orphaned-members", authMiddleware, AdminController.cleanupOrphanedGroupMembers);

router.delete("/api/admin/call-records", authMiddleware, (AdminController.deleteCallRecord));

router.get("/call-records", authMiddleware, adminMiddleware, (AdminController.getAllCallRecords));

// ============== HOME PAGE CONTENT (new — admin can edit hero copy + the 4 boxes) ==============
// GET is admin-only here (prefills the editor form); the PUBLIC read used by
// the actual Home.jsx page lives at GET /api/content/home (see ContentRoute.js)
router.get("/home-content", authMiddleware, adminMiddleware, (ContentController.getHomeContent));
router.put("/home-content", authMiddleware, adminMiddleware, (ContentController.updateHomeContent));

module.exports = router