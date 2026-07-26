const mongoose = require("mongoose");

// One "entry" = one of the 4 boxes in the "dispatch, entry by entry" section
const entrySchema = new mongoose.Schema(
  {
    icon: { type: String, default: "fa-solid fa-bolt" }, // font-awesome class, e.g. "fa-solid fa-bolt"
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const HomeContentSchema = new mongoose.Schema(
  {
    // ===== HERO (top section — left copy + right chat mock header) =====
    heroEyebrow: { type: String, default: "LIVE DISPATCH · NO. 001" },
    heroTitleLine1: { type: String, default: "Every message," },
    heroTitleLine2: { type: String, default: "delivered the moment it's sent." },
    heroSubtitle: {
      type: String,
      default:
        "Talkify is a real-time messaging line for the people you actually talk to — one-on-one or in a group, with read receipts, replies, and media, minus the noise.",
    },
    heroCtaPrimaryText: { type: String, default: "Start Talking" },
    heroCtaGhostText: { type: String, default: "I already have an account" },
    wireThreadLabel: { type: String, default: 'THREAD — "DESIGN CREW"' },

    // ===== LOG SECTION (the 4 boxes) =====
    logSectionTitle: { type: String, default: "The dispatch, entry by entry" },
    entries: {
      type: [entrySchema],
      default: [
        {
          icon: "fa-solid fa-bolt",
          title: "Real-time, always",
          description:
            "Messages land the instant they're sent — no refresh, no lag, no waiting on the wire.",
        },
        {
          icon: "fa-solid fa-users",
          title: "Groups that hold up",
          description:
            "Invite codes, admins, and member controls built for threads that actually get busy.",
        },
        {
          icon: "fa-solid fa-check-double",
          title: "Know where you stand",
          description:
            "Sent, delivered, seen. Replies and edits stay attached to the message they belong to.",
        },
        {
          icon: "fa-solid fa-image",
          title: "Media, handled well",
          description:
            "Drop in photos and files without losing the thread of the conversation around them.",
        },
      ],
    },

    // ===== CLOSER SECTION (bottom CTA) =====
    closerTitle: { type: String, default: "Your line is open." },
    closerSubtitle: {
      type: String,
      default: "Create an account and send your first dispatch in under a minute.",
    },
    closerButtonText: { type: String, default: "Create Account" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeContent", HomeContentSchema);