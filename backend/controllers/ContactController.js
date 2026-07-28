const Contact = require("./../models/ContactSchema");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

 
const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Name, email, and message are all required",
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    res.status(201).json({
      message: "Message sent successfully",
      contact,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error submitting your message",
    });
  }
};

 
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    const total = await Contact.countDocuments(query);

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching messages",
    });
  }
};

 
const updateContactStatus = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status } = req.body;

    if (!["new", "read", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({
      message: "Status updated",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating status",
    });
  }
};

// Admin-only — delete a message
const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findByIdAndDelete(contactId);

    if (!contact) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting message",
    });
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
};