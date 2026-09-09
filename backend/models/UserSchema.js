const mongoose = require("mongoose")
const UserSchema=new mongoose.Schema({
     name: {
    type: String,
    required: true,
    default: "New User"    
  },
  email: {
    type: String,
    required: function () { return this.authType === "password" }, 
    sparse: true,    
  },
  password: {
    type: String,
    required: function () { return this.authType === "password" },  
  },
  image: {
    type: String,
    required: false,
    default: ""
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
    pinnedChats: [
      {
        chatId: { type: String, required: true },
        chatType: { type: String, enum: ["user", "group"], required: true },
        pinnedAt: { type: Date, default: Date.now },
      },
    ],
});
const User=new mongoose.model("User",UserSchema)
module.exports=User