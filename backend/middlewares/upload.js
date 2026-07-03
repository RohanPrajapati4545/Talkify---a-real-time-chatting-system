const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "talkify_uploads",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm"],
        resource_type: "auto", // images + videos dono handle karega
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

module.exports = upload;