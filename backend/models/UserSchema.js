const mongoose = require("mongoose")
const UserSchema=new mongoose.Schema({
     name: {
    type: String,
    required: true,
    default: "New User"   // 👈 OTP signup ke time auto-filled
  },
  email: {
    type: String,
    required: function () { return this.authType === "password" }, // 👈
    sparse: true,   // 👈 multiple docs mein empty/missing email allow karega
  },
  password: {
    type: String,
    required: function () { return this.authType === "password" }, // 👈
  },
  image: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true,
    unique: true,     
    sparse: true,
  },
  authType: {           
    type: String,
    enum: ["password", "otp"],
    default: "password",
  },
     role:{
        type:String,
        enum:['user', 'admin'],
        default:'user'
    },
   blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false
    },

});
const User=new mongoose.model("User",UserSchema)
module.exports=User