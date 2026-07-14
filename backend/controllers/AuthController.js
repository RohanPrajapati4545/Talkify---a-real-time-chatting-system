const userSchema=require("./../models/UserSchema")
const bcrypt = require("bcrypt");
const jwt= require("jsonwebtoken")
const register=async (req,res)=>{

    try {
        const {name, email, password,confirm_password, contact}=req.body;
        const image=req.file?.path;

        const userExists=await userSchema.findOne({email}) 
        
        if(!name || !email || !password || !confirm_password || !contact || !image){
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




module.exports={register, login}