const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Middleware: reuse jwtVerify logic from server.js
const jwtVerify = (req, res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
};

// ➕ Add a new emergency contact
router.post("/", jwtVerify, async (req, res) => {
  try {
    const { name, email, phone, relation } = req.body; // include email!
    const newContact = new EmergencyContact({
      userId: req.user.id,
      name,
      email,
      phone,
      relation
    });
    await newContact.save();
    res.json(newContact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📋 Get all contacts of logged-in user
router.get("/", jwtVerify, async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.user.id });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update a contact
router.put("/:id", jwtVerify, async (req, res) => {
  try {
    const { name, email, phone, relation } = req.body; // include email in update
    let contact = await EmergencyContact.findOne({ _id: req.params.id, userId: req.user.id });
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    contact = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, relation },
      { new: true }
    );
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Delete a contact
router.delete("/:id", jwtVerify, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    res.json({ message: "Contact deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📧 Send emergency email with location
router.post("/send-email", jwtVerify, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const contacts = await EmergencyContact.find({ userId: req.user.id });
    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ error: "No emergency contacts found" });
    }

    // Extract only emails that are not empty
    const recipientEmails = contacts.map(c => c.email).filter(e => !!e);

    if (recipientEmails.length === 0) {
      return res.status(400).json({ error: "No contacts have valid email addresses" });
    }

    // Build location link if available
    let locationMessage = "";
    if (latitude && longitude) {
      locationMessage = `\n\n📍 Current Location: https://www.google.com/maps?q=${latitude},${longitude}`;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"SafeHeaven" <${process.env.EMAIL_USER}>`,
      to: recipientEmails,
      subject: "🚨 Emergency Alert",
      text: `This is an emergency alert. Please check on your loved one immediately.${locationMessage}`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Emergency email sent with location" });
  } catch (err) {
    console.error("Error sending emergency email:", err);
    res.status(500).json({ error: "Failed to send emergency emails" });
  }
});


module.exports = router;
