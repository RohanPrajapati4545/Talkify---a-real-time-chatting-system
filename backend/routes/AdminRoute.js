const express=require("express")
const router=express.Router()
const upload=require("./../middlewares/upload")

const AuthController=require("./../controllers/AuthController")
const adminMiddleware = require("./../middlewares/adminMiddleware")
const authMiddleware = require("../middlewares/authMiddleware")
const AdminController=require("./../controllers/AdminController")

router.get("/get-all-user", authMiddleware, adminMiddleware, (AdminController.getAllUsers));
router.get("/get-all-group", authMiddleware, adminMiddleware, (AdminController.getAllGroups));
router.get("/get-messages-count",authMiddleware, adminMiddleware, (AdminController.getMessagesCount));
router.get("/get-reported-messages", authMiddleware, adminMiddleware, (AdminController.getReportedMessages));
router.post("/warn-report", authMiddleware, adminMiddleware,(AdminController.warnReport));
router.post("/block-report", authMiddleware, adminMiddleware, (AdminController.blockReport));
router.post("/delete-report", authMiddleware, adminMiddleware, (AdminController.deleteReport));
router.get("/get-user/:id", authMiddleware, adminMiddleware, (AdminController.getUserById));


module.exports=router