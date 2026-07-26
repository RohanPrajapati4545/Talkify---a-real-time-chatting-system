const express = require("express");
const router = express.Router();
const AboutContent = require("../models/AboutContentSchema");

// GET /api/content/about — public, no auth. Returns the single content doc,
// creating it with schema defaults on first request if it doesn't exist yet.
router.get("/about", async (req, res) => {
  try {
    let content = await AboutContent.findOne();

    if (!content) {
      content = await AboutContent.create({});
    }

    res.json({ content });
  } catch (error) {
    console.log("GET /api/content/about error:", error);
    res.status(500).json({ message: "Could not load about page content." });
  }
});

module.exports = router;