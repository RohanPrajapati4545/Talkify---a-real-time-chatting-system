const userSchema = require("./../models/UserSchema")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const crypto = require("crypto");
const { Resend } = require("resend");
const Otp = require("./../models/OtpSchema");
const { sendOtpSms } = require("./../controllers/SmsService");

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

const resend = new Resend(process.env.RESEND_API_KEY);

const register = async (req, res) => {

    try {
        const { name, email, password, confirm_password, contact } = req.body;

        const DEFAULT_AVATAR_BASE = "https://ui-avatars.com/api/";
        const image = req.file?.path
            || `${DEFAULT_AVATAR_BASE}?name=${encodeURIComponent(name || "U")}&background=random&color=fff&rounded=true&bold=true`;

        const userExists = await userSchema.findOne({ email })

        if (!name || !email || !password || !confirm_password || !contact) {
            return res.status(400).json({ msg: "all fields are required" })
        }
        if (userExists) {
            return res.status(400).json({ msg: "user already exists" })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const data = new userSchema({
            name,
            email,
            password: hashedPassword,
            contact,
            image
        })

        const dataCreated = await data.save()
        return res.status(201).json({ msg: "User Registered Successfully", dataCreated })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ msg: "internal server error" })
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
        res.status(200).json({ msg: "You have logged in", token, user: userExist })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ msg: "Internal server error" })
    }
}

const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ msg: "Please enter a valid 10-digit phone number" });
        }

        const existingUser = await userSchema.findOne({ contact: phone });

        if (!existingUser) {
            return res.status(404).json({
                msg: "No account found with this number. Please sign up first.",
            });
        }

        if (existingUser.isBlocked) {
            return res.status(403).json({ msg: "You have been blocked by admin" });
        }

        const recentOtp = await Otp.findOne({ contact: phone }).sort({ createdAt: -1 });
        if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
            const waitSec = Math.ceil(
                (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000
            );
            return res.status(429).json({ msg: `Please wait ${waitSec}s before requesting again` });
        }

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

        await Otp.deleteOne({ _id: otpRecord._id });

        const user = await userSchema.findOne({ contact: phone });

        if (!user) {
            return res.status(404).json({ msg: "No account found with this number. Please sign up first." });
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

const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: "Email is required" });
        }

        const existingUser = await userSchema.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ msg: "No account found with this email" });
        }

        if (existingUser.isBlocked) {
            return res.status(403).json({ msg: "You have been blocked by admin" });
        }

        const recentOtp = await Otp.findOne({ contact: email }).sort({ createdAt: -1 });
        if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
            const waitSec = Math.ceil(
                (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000
            );
            return res.status(429).json({ msg: `Please wait ${waitSec}s before requesting again` });
        }

        await Otp.deleteMany({ contact: email });

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        await Otp.create({
            contact: email,
            otpHash,
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        });

        await resend.emails.send({
            from: "Talkify <onboarding@resend.dev>",
            to: email,
            subject: "Password Recovery OTP",
            text: `Your OTP for password recovery is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        });

        return res.status(200).json({ msg: "OTP sent to your email" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Failed to send OTP, please try again" });
    }
};

const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ msg: "Email and OTP are required" });
        }

        const otpRecord = await Otp.findOne({ contact: email }).sort({ createdAt: -1 });

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

        otpRecord.verified = true;
        await otpRecord.save();

        return res.status(200).json({ msg: "OTP verified successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Verification failed" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, new_password, confirm_password } = req.body;

        if (!email || !new_password || !confirm_password) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({ msg: "New and confirm password should be same" });
        }

        const otpRecord = await Otp.findOne({ contact: email }).sort({ createdAt: -1 });

        if (!otpRecord || !otpRecord.verified) {
            return res.status(400).json({ msg: "OTP verification required" });
        }

        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        user.password = hashedPassword;
        await user.save();

        await Otp.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({ msg: "Password reset successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Something went wrong" });
    }
};

module.exports = { register, login, sendOtp, verifyOtp, sendEmailOtp, verifyEmailOtp, resetPassword }