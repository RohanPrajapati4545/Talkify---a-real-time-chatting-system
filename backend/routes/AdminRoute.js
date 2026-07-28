const express = require("express")
const router = express.Router()
const upload = require("./../middlewares/upload")

const AuthController = require("./../controllers/AuthController")
const adminMiddleware = require("./../middlewares/adminMiddleware")
const authMiddleware = require("../middlewares/authMiddleware")
const AdminController = require("./../controllers/AdminController")
const homeContentController = require("./../controllers/HomeContentController")

// dashboard / users
router.get("/get-all-user", authMiddleware, adminMiddleware, (AdminController.getAllUsers));
router.get("/get-messages-count", authMiddleware, adminMiddleware, (AdminController.getMessagesCount));
router.get("/get-reported-messages", authMiddleware, adminMiddleware, (AdminController.getReportedMessages));
router.post("/warn-report", authMiddleware, adminMiddleware, (AdminController.warnReport));
router.post("/block-report", authMiddleware, adminMiddleware, (AdminController.blockReport));
router.post("/delete-report", authMiddleware, adminMiddleware, (AdminController.deleteReport));
router.get("/get-user/:id", authMiddleware, adminMiddleware, (AdminController.getUserById));
router.put("/update-user", authMiddleware, upload.single("image"), AdminController.updateUser);
router.post("/block-user", authMiddleware, adminMiddleware, (AdminController.blockUser));
router.post("/unblock-user", authMiddleware, adminMiddleware, (AdminController.unblockUser));
router.post("/delete-user", authMiddleware, adminMiddleware, (AdminController.deleteUser));

// admin's own profile / settings (AdminProfile.jsx)
router.put("/update-profile", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.updateProfile));
router.put("/change-password", authMiddleware, adminMiddleware, (AdminController.changePassword));

// groups
router.get("/get-all-group", authMiddleware, adminMiddleware, (AdminController.getAllGroups));
router.post("/delete-group", authMiddleware, adminMiddleware, (AdminController.deleteGroup));
router.put("/update-group", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.updateGroup));
router.post("/remove-group-member", authMiddleware, adminMiddleware, (AdminController.removeGroupMember));
router.post("/change-group-admin", authMiddleware, adminMiddleware, (AdminController.changeGroupAdmin));

// group chat moderation
router.get("/get-group-messages/:groupId", authMiddleware, adminMiddleware, (AdminController.getGroupMessages));
router.put("/edit-group-message", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.editGroupMessage));
router.post("/delete-group-message", authMiddleware, adminMiddleware, (AdminController.deleteGroupMessage));
router.post("/clear-group-chat", authMiddleware, adminMiddleware, (AdminController.clearGroupChat));

// private (1-to-1) chat moderation
router.get("/get-user-chats/:userId", authMiddleware, adminMiddleware, (AdminController.getUserChats));
router.get("/get-private-messages/:chatId", authMiddleware, adminMiddleware, (AdminController.getPrivateChatMessages));
router.put("/edit-private-message", authMiddleware, adminMiddleware, upload.single("image"), (AdminController.editPrivateMessage));
router.post("/delete-private-message", authMiddleware, adminMiddleware, (AdminController.deletePrivateMessage));
router.post("/clear-private-chat", authMiddleware, adminMiddleware, (AdminController.clearPrivateChat));
router.post("/delete-private-chat", authMiddleware, adminMiddleware, (AdminController.deletePrivateChatAdmin));
router.post("/add-group-member", authMiddleware, adminMiddleware, (AdminController.addGroupMember));
router.post("/cleanup-orphaned-members", authMiddleware, AdminController.cleanupOrphanedGroupMembers);

router.delete("/api/admin/call-records", authMiddleware, (AdminController.deleteCallRecord));

router.get("/call-records", authMiddleware, adminMiddleware, (AdminController.getAllCallRecords));

 
router.get("/home-content", authMiddleware, adminMiddleware, (homeContentController.getHomeContent));
router.put("/home-content", authMiddleware, adminMiddleware, (homeContentController.updateHomeContent));
 
const AboutContent = require("../models/AboutContentSchema");
 
router.get("/about-content", authMiddleware, async (req, res) => {
  try {
    let content = await AboutContent.findOne();

    if (!content) {
      content = await AboutContent.create({});
    }

    res.json({ content });
  } catch (error) {
    console.log("GET /api/admin/about-content error:", error);
    res.status(500).json({ message: "Could not load about page content." });
  }
});

 
router.put("/about-content", authMiddleware, async (req, res) => {
  try {
    let content = await AboutContent.findOne();

    if (!content) {
      content = await AboutContent.create(req.body);
    } else {
      Object.assign(content, req.body);
      await content.save();
    }

    res.json({ content });
  } catch (error) {
    console.log("PUT /api/admin/about-content error:", error);
    res.status(500).json({ message: "Could not save about page content." });
  }
});


 
const SiteSettings = require("../models/SiteSettingsSchema");

// GET /api/admin/settings
router.get("/settings", authMiddleware, async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({});
    }

    res.json({ settings });
  } catch (error) {
    console.log("GET /api/admin/settings error:", error);
    res.status(500).json({ message: "Could not load site settings." });
  }
});

 
router.put("/settings", authMiddleware, async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    res.json({ settings });
  } catch (error) {
    console.log("PUT /api/admin/settings error:", error);
    res.status(500).json({ message: "Could not save site settings." });
  }
});

 
router.put("/settings/logo", authMiddleware, upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No logo file received." });
    }

    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({ siteLogoUrl: req.file.path });
    } else {
      settings.siteLogoUrl = req.file.path;
      await settings.save();
    }

    res.json({ settings });
  } catch (error) {
    console.log("PUT /api/admin/settings/logo error:", error);
    res.status(500).json({ message: "Could not upload logo." });
  }
});
 
router.put("/settings/favicon", authMiddleware, upload.single("favicon"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No favicon file received." });
    }

    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({ siteFaviconUrl: req.file.path });
    } else {
      settings.siteFaviconUrl = req.file.path;
      await settings.save();
    }

    res.json({ settings });
  } catch (error) {
    console.log("PUT /api/admin/settings/favicon error:", error);
    res.status(500).json({ message: "Could not upload favicon." });
  }
});
module.exports = router