const mongoose = require("mongoose");

const SiteSettingsSchema = new mongoose.Schema(
  {
    otpLoginEnabled: { type: Boolean, default: true },

    
    siteName: { type: String, default: "Talkify" },

    
    siteLogoUrl: { type: String, default: "" },
 
    siteFaviconUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", SiteSettingsSchema);