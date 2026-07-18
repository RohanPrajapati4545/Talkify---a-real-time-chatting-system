const mongoose = require("mongoose")
const UserSchema=new mongoose.Schema({
     name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true,
    default: ""
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