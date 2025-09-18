// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Create Google client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ================== EMAIL TRANSPORTER ==================
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ================== REGISTER ==================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // expires in 10 min
    });
    await user.save();

    // send OTP email
    await transporter.sendMail({
      from: `"SafeHeaven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email - SafeHeaven",
      text: `Your OTP for email verification is ${otp}. It will expire in 10 minutes.`
    });

    res.status(201).json({ message: "OTP sent to your email. Please verify." });
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ================== VERIFY OTP ==================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ mark verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // ✅ auto-login: generate JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Email verified & logged in successfully!",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("OTP Verification Error:", err.message);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
});


// ================== RESEND OTP ==================
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    // send OTP email
    await transporter.sendMail({
      from: `"SafeHeaven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Resend OTP - SafeHeaven",
      text: `Your new OTP is ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: "New OTP sent to your email." });
  } catch (err) {
    console.error("Resend OTP Error:", err.message);
    res.status(500).json({ message: "Server error while resending OTP" });
  }
});

// ================== LOGIN ==================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // check if verified
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email before login." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // ✅ include id, name, email in token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// ================== FORGOT PASSWORD (Send OTP) ==================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not registered" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send email
    await transporter.sendMail({
      from: `"SafeHeaven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - SafeHeaven",
      text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    res.status(500).json({ message: "Server error during forgot password" });
  }
});

// ================== VERIFY RESET OTP ==================
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ OTP correct
    res.status(200).json({ message: "OTP verified. You can reset your password now." });
  } catch (err) {
    console.error("Verify Reset OTP Error:", err.message);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
});

// ================== RESET PASSWORD ==================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful! Please login." });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    res.status(500).json({ message: "Server error during password reset" });
  }
});



// ================== GOOGLE SIGN-IN ==================
router.post('/google', async (req, res) => {
  try {
    const { tokenId } = req.body; // frontend sends Google ID token

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload; // "sub" is Google user ID

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // If not exists, create one with Google ID
      user = new User({
        name,
        email,
        password: '', // no password since Google handles it
        googleId: sub,
        isVerified: true // ✅ Gmail users are auto-verified
      });
      await user.save();
    }

    // ✅ include id, name, email in token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Google login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Google Login Error:', err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
});

module.exports = router;
