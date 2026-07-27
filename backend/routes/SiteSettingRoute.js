const express = require("express");
const router = express.Router();
const SiteSettings = require("../models/SiteSettingsSchema");

// GET /api/content/settings — public, no auth. Returns feature toggles,
// creating the doc with defaults on first request if it doesn't exist yet.
router.get("/settings", async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({});
    }

    res.json({ settings });
  } catch (error) {
    console.log("GET /api/content/settings error:", error);
    res.status(500).json({ message: "Could not load site settings." });
  }
});

module.exports = router;