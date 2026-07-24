const express = require("express");
const router = express.Router();
const ContactController = require("./../controllers/ContactController");
const AuthMiddleware = require("./../middlewares/authMiddleware");

// Public — no auth needed, anyone visiting /contact can submit
router.post("/submit", ContactController.submitContact);

// Admin-only — swap AuthMiddleware below for your AdminMiddleware if you
// have a separate one (matching how AdminRoute.js protects its routes)
router.get("/all", AuthMiddleware, ContactController.getAllContacts);
router.put("/:contactId/status", AuthMiddleware, ContactController.updateContactStatus);
router.delete("/:contactId", AuthMiddleware, ContactController.deleteContact);

module.exports = router;