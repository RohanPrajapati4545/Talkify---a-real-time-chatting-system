const express=require("express")
const router=express.Router()
const upload=require("./../middlewares/upload")

const AuthController=require("./../controllers/AuthController")
const adminMiddleware = require("./../middlewares/adminMiddleware")
router.post("/register",upload.single("image"), AuthController.register)
router.post("/login", AuthController.login)
router.post("/send-otp", AuthController.sendOtp);
router.post("/verify-otp",AuthController.verifyOtp);


router.post('/send-email-otp', AuthController.sendEmailOtp)
router.post('/verify-email-otp', AuthController.verifyEmailOtp)
router.post('/reset-password', AuthController.resetPassword)

module.exports=router   