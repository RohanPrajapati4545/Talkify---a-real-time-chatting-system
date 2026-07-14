const jwt = require("jsonwebtoken")
const userSchema = require("./../models/UserSchema")

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
           return res.status(401).json({ msg: "No token provided" })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)

        const user = await userSchema.findById(decoded.id)
        if (!user) {
            return res.status(404).json({ msg: "User not found" })
        }

        if (user.isBlocked) {
            return res.status(403).json({ msg: "You have been blocked by admin" })
        }

        req.user = decoded
        next()
    } catch (error) {
        res.status(400).json({ msg: "Invalid or expired token" })
    }
}
module.exports = authMiddleware