const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  contact: {
    type: String,
    required: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  
    index: { expires: 0 },
  },
});

const Otp = mongoose.model("Otp", OtpSchema);
module.exports = Otp;