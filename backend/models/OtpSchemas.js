const mongoose = require("mongoose");

const OtpSchemas = new mongoose.Schema({
    contact: {
        type: String,
        required: true
    },
    otpHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Otp", OtpSchemas);