const userSchema=require("./../models/UserSchema")
const bcrypt = require("bcrypt");
const jwt= require("jsonwebtoken")
const crypto = require("crypto");
const Otp = require("./../models/OtpSchema");
const { sendOtpSms } = require("./../controllers/SmsService");

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const register=async (req,res)=>{

    try {
        const {name, email, password,confirm_password, contact}=req.body;

        // image optional hai — agar upload nahi hui to Telegram jaisa default avatar (initials-based) set hoga
        const DEFAULT_AVATAR_BASE = "https://ui-avatars.com/api/";
        const image = req.file?.path
            || `${DEFAULT_AVATAR_BASE}?name=${encodeURIComponent(name || "U")}&background=random&color=fff&rounded=true&bold=true`;

        const userExists=await userSchema.findOne({email}) 
        
        if(!name || !email || !password || !confirm_password || !contact){
            return  res.status(400).json({msg:"all fields are required"})
        }
        if(userExists){
            return res.status(400).json({msg:"user already exists"})
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const data=new userSchema({
            name, 
            email,
            password: hashedPassword,
            contact,
            image
        })

        const dataCreated= await data.save()
        console.log("Saved User:", dataCreated);
          return res.status(201).json({ msg: "User Registered Successfully",dataCreated })
    } catch (error) {
          console.log(error)
        return res.status(500).json({msg:"internal server error"})
    }
}




const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: "All fields are required" })
        }

        const userExist = await userSchema.findOne({ email })
        if (!userExist) {
            return res.status(400).json({ msg: " you are not registered user" })
        }

        // 🔒 blocked check — password verify se pehle
        if (userExist.isBlocked) {
            return res.status(403).json({ msg: "You have been blocked by admin" })
        }

        const passwordMatch = await bcrypt.compare(password, userExist.password);
        if (!passwordMatch) {

            return res.status(400).json({ msg: "Email or password invalid" })
        }

        const token = jwt.sign(
            { id: userExist._id, email: userExist.email, role: userExist.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "24h" }
        )
        res.status(200).json({ msg: "You have logged in", token,  user: userExist })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ msg: "Internal server error" })
    }
}



// ---------- SEND OTP ----------
const sendOtp = async (req, res) => {
  try {


      const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ 
        msg: "No account found with this number. Please sign up first." 
      });
    }
    const { phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ msg: "Please enter a valid 10-digit phone number" });
    }

    // Rate limit — same number pe baar baar spam na ho
    const recentOtp = await Otp.findOne({ contact: phone }).sort({ createdAt: -1 });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
      const waitSec = Math.ceil(
        (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000
      );
      return res.status(429).json({ msg: `Please wait ${waitSec}s before requesting again` });
    }

    // Agar blocked user hai to OTP hi mat bhejo
    const existingUser = await userSchema.findOne({ contact: phone });
    if (existingUser?.isBlocked) {
      return res.status(403).json({ msg: "You have been blocked by admin" });
    }

    // Purane pending OTPs is number ke liye clear karo
    await Otp.deleteMany({ contact: phone });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await Otp.create({
      contact: phone,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    await sendOtpSms(phone, otp);

    return res.status(200).json({ msg: "OTP sent to your phone" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Failed to send OTP, please try again" });
  }
};

// ---------- VERIFY OTP ----------
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ msg: "Phone number and OTP are required" });
    }

    const otpRecord = await Otp.findOne({ contact: phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ msg: "OTP not found, please request a new one" });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "OTP expired, please request a new one" });
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ msg: "Too many failed attempts, please request a new OTP" });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // ✅ OTP correct — consume it
    await Otp.deleteOne({ _id: otpRecord._id });

    // Existing user hai to login, nahi to naya banao
    let user = await userSchema.findOne({ contact: phone });

    if (!user) {
      const DEFAULT_AVATAR_BASE = "https://ui-avatars.com/api/";
      user = await userSchema.create({
        name: `User${phone.slice(-4)}`,
        contact: phone,
        authType: "otp",
        image: `${DEFAULT_AVATAR_BASE}?name=U&background=random&color=fff&rounded=true&bold=true`,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ msg: "You have been blocked by admin" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    return res.status(200).json({ msg: "Signed in successfully", token, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Verification failed" });
  }
};

module.exports = { register, login, sendOtp, verifyOtp };

