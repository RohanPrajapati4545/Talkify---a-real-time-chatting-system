const mongoose = require("mongoose");

// Single-document collection — one row holds all site-wide feature toggles.
// Add more toggles here later (e.g. registrationEnabled, maintenanceMode)
// without needing a new schema each time.
const SiteSettingsSchema = new mongoose.Schema(
  {
    otpLoginEnabled: { type: Boolean, default: true },

    // ===== BRANDING =====
    siteName: { type: String, default: "Talkify" },
    // relative path saved by multer (e.g. "uploads/logo-123.png"), same
    // convention as user/group images elsewhere in this app. Empty string
    // means "no custom logo uploaded yet" — fall back to the feather icon.
    siteLogoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", SiteSettingsSchema);