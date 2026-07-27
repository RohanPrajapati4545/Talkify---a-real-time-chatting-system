const mongoose = require("mongoose");

// Single-document collection — one row holds all site-wide feature toggles.
// Add more toggles here later (e.g. registrationEnabled, maintenanceMode)
// without needing a new schema each time.
const SiteSettingsSchema = new mongoose.Schema(
  {
    otpLoginEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", SiteSettingsSchema);