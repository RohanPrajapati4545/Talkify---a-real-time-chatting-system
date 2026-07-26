const mongoose = require("mongoose");

// One row in the "dispatch log" timeline
const timelineEntrySchema = new mongoose.Schema(
  {
    stamp: { type: String, default: "" }, // e.g. "ENTRY 01 · DAY ONE"
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// One card in the "what the line runs on" values grid
const valueCardSchema = new mongoose.Schema(
  {
    icon: { type: String, default: "fa-solid fa-bolt" }, // font-awesome class
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const AboutContentSchema = new mongoose.Schema(
  {
    // ===== TOP HERO =====
    heroEyebrow: { type: String, default: "ABOUT THE LINE" },
    aboutTitleLine1: { type: String, default: "Built for conversations," },
    aboutTitleLine2: { type: String, default: "not for feeds." },
    aboutLede: {
      type: String,
      default:
        "Talkify started as a simple question: why does chatting with people you actually know keep feeling like scrolling a timeline? We stripped it back to what a message line is supposed to be — fast, direct, and yours.",
    },

    // ===== TIMELINE SECTION =====
    timelineSectionTitle: { type: String, default: "The dispatch log" },
    timelineEntries: {
      type: [timelineEntrySchema],
      default: [
        {
          stamp: "ENTRY 01 · DAY ONE",
          title: "A one-to-one prototype",
          description:
            "The first version was just two people and a socket connection — no groups, no media, just messages arriving instantly.",
        },
        {
          stamp: "ENTRY 02 · GROUPS",
          title: "Threads that scale",
          description:
            "We added invite codes, admins, and member controls so a thread could hold a real group without turning into chaos.",
        },
        {
          stamp: "ENTRY 03 · SIGNAL",
          title: "Read receipts, replies, edits",
          description:
            "Small signals — sent, delivered, seen — so you always know where a conversation actually stands.",
        },
        {
          stamp: "ENTRY 04 · TODAY",
          title: "One line, kept simple",
          description:
            "Every feature since has had to earn its place. If it doesn't make a conversation easier, it doesn't ship.",
        },
      ],
    },

    // ===== VALUES SECTION =====
    valuesSectionTitle: { type: String, default: "What the line runs on" },
    valueCards: {
      type: [valueCardSchema],
      default: [
        {
          icon: "fa-solid fa-bolt",
          title: "Speed over spectacle",
          description: "Real-time means real-time. No spinners pretending to be instant.",
        },
        {
          icon: "fa-solid fa-lock",
          title: "Your thread, your rules",
          description: "Block, leave, or lock a group down — control stays with the people in it.",
        },
        {
          icon: "fa-solid fa-feather",
          title: "Quiet by design",
          description: "No algorithmic feed, no engagement bait. Just the people you talk to.",
        },
      ],
    },

    // ===== STATS SECTION (count-up numbers) =====
    statThreadsTarget: { type: String, default: "10000+" },
    statThreadsLabel: { type: String, default: "Active Threads" },
    statMessagesTarget: { type: String, default: "2000000+" },
    statMessagesLabel: { type: String, default: "Messages Sent" },
    statUptimeTarget: { type: String, default: "99.9%" },
    statUptimeLabel: { type: String, default: "Uptime" },

    // ===== CLOSER SECTION =====
    closerTitle: { type: String, default: "Ready to open your own line?" },
    closerSubtitle: { type: String, default: "It takes less than a minute to send your first message." },
    closerButtonText: { type: String, default: "Get Started" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AboutContent", AboutContentSchema);