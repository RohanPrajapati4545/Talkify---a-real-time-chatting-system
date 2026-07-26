const express = require("express");
const router = express.Router();

const ContentController = require("../controllers/ContentController");

// PUBLIC — anyone (logged in or not) can read the current home content
router.get("/home", ContentController.getHomeContent);

module.exports = router;