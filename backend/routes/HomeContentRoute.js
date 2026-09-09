const express = require("express");
const router = express.Router();

const homeContentController = require("./../controllers/HomeContentController");

// PUBLIC — anyone (logged in or not) can read the current home content
router.get("/home", homeContentController.getHomeContent);

module.exports = router;