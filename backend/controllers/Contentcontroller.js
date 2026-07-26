const HomeContent = require("../models/HomeContentSchema");

// There is only ever ONE home-content document (site-wide singleton).
// If it doesn't exist yet (fresh DB), create it with schema defaults
// the first time anyone asks for it.
const getOrCreateHomeContent = async () => {
  let content = await HomeContent.findOne();
  if (!content) {
    content = await HomeContent.create({});
  }
  return content;
};

// PUBLIC — called by Home.jsx on page load. No auth required, anyone
// visiting the site needs to be able to fetch the current content.
exports.getHomeContent = async (req, res) => {
  try {
    const content = await getOrCreateHomeContent();
    res.status(200).json({ content });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to fetch home content" });
  }
};

// ADMIN ONLY — called from the admin panel editor. Every field is optional;
// only whatever is sent in the body gets updated, so the admin can change
// just the hero copy, or just one of the 4 boxes, etc.
exports.updateHomeContent = async (req, res) => {
  try {
    const {
      heroEyebrow,
      heroTitleLine1,
      heroTitleLine2,
      heroSubtitle,
      heroCtaPrimaryText,
      heroCtaGhostText,
      wireThreadLabel,
      logSectionTitle,
      entries, // array of exactly 4 { icon, title, description } — or a JSON string of that array
      closerTitle,
      closerSubtitle,
      closerButtonText,
    } = req.body;

    const content = await getOrCreateHomeContent();

    if (heroEyebrow !== undefined) content.heroEyebrow = heroEyebrow;
    if (heroTitleLine1 !== undefined) content.heroTitleLine1 = heroTitleLine1;
    if (heroTitleLine2 !== undefined) content.heroTitleLine2 = heroTitleLine2;
    if (heroSubtitle !== undefined) content.heroSubtitle = heroSubtitle;
    if (heroCtaPrimaryText !== undefined) content.heroCtaPrimaryText = heroCtaPrimaryText;
    if (heroCtaGhostText !== undefined) content.heroCtaGhostText = heroCtaGhostText;
    if (wireThreadLabel !== undefined) content.wireThreadLabel = wireThreadLabel;
    if (logSectionTitle !== undefined) content.logSectionTitle = logSectionTitle;
    if (closerTitle !== undefined) content.closerTitle = closerTitle;
    if (closerSubtitle !== undefined) content.closerSubtitle = closerSubtitle;
    if (closerButtonText !== undefined) content.closerButtonText = closerButtonText;

    if (entries !== undefined) {
      let parsedEntries = entries;

      // if it arrived as a JSON string (e.g. sent via multipart/form-data
      // alongside a file upload), parse it
      if (typeof entries === "string") {
        try {
          parsedEntries = JSON.parse(entries);
        } catch (e) {
          return res.status(400).json({ msg: "entries must be valid JSON" });
        }
      }

      if (!Array.isArray(parsedEntries) || parsedEntries.length !== 4) {
        return res.status(400).json({ msg: "entries must be an array of exactly 4 items (the 4 boxes)" });
      }

      content.entries = parsedEntries.map((e) => ({
        icon: e.icon || "fa-solid fa-bolt",
        title: e.title || "",
        description: e.description || "",
      }));
    }

    await content.save();

    res.status(200).json({ content, msg: "Home content updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to update home content" });
  }
};