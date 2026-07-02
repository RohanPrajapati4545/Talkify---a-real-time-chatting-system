const mongoose = require("mongoose")
const userSchema=new mongoose.Schema({
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
    required: true
  },
   blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

});
const User=new mongoose.model("User",userSchema)
module.exports=User