const mongoose=require("mongoose")
const URL=process.env.MONGO_URL;
mongoose.connect(URL)
.then(()=>{
    console.log("connection is done to db")
})
.catch((error)=>{
    console.log("error in connection")
})