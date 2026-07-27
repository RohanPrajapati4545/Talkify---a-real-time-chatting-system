const mongoose = require("mongoose");

const SiteSettingsSchema = new mongoose.Schema(
  {
    otpLoginEnabled: { type: Boolean, default: true },

    // ===== BRANDING =====
    siteName: { type: String, default: "Talkify" },

    // Logo — shown on sign-in page etc.
    siteLogoUrl: { type: String, default: "" },

    // Favicon — separate from logo, shown in browser tab
    siteFaviconUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", SiteSettingsSchema);