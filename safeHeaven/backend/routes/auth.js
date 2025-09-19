// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nodemailer transporter (Gmail or your SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helpers
const makeOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const signJwt = (payload, expiresIn = '1h') =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
const isEmail = (e) => typeof e === 'string' && /\S+@\S+\.\S+/.test(e);

// 1) Register: create user, send OTP
router.post('/register', async (req, res) => {
  try {
    const { name = '', email = '', password = '' } = req.body || {};
    if (!name.trim() || !isEmail(email) || !password) {
      return res.status(400).json({ message: 'Valid name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = makeOTP();

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await user.save();

    await transporter.sendMail({
      from: `"SafeHeaven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email - SafeHeaven',
      text: `Your OTP for email verification is ${otp}. It will expire in 10 minutes.`
    });

    return res.status(201).json({ message: 'OTP sent to your email. Please verify.' });
  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// 2) Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email = '', otp = '' } = req.body || {};
    if (!isEmail(email) || !otp) {
      return res.status(400).json({ message: 'Valid email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = signJwt({ id: user._id, name: user.name, email: user.email });
    return res.status(200).json({
      message: 'Email verified & logged in successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// 3) Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email = '' } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ message: 'Valid email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const otp = makeOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: `"SafeHeaven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Resend OTP - SafeHeaven',
      text: `Your new OTP is ${otp}. It will expire in 10 minutes.`
    });

    return res.status(200).json({ message: 'New OTP sent to your email.' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    return res.status(500).json({ message: 'Server error while resending OTP' });
  }
});

// 4) Login
router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};
    if (!isEmail(email) || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before login.' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = signJwt({ id: user._id, name: user.name, email: user.email });
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// 5) Forgot password (send OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email = '' } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ message: 'Valid email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not registered' });

    const otp = makeOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: `"SafeHeaven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - SafeHeaven',
      text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`
    });

    return res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({ message: 'Server error during forgot password' });
  }
});

// 6) Verify reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email = '', otp = '' } = req.body || {};
    if (!isEmail(email) || !otp) {
      return res.status(400).json({ message: 'Valid email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.otp || user.otp !== otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    return res.status(200).json({ message: 'OTP verified. You can reset your password now.' });
  } catch (err) {
    console.error('Verify Reset OTP Error:', err);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// 7) Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email = '', newPassword = '' } = req.body || {};
    if (!isEmail(email) || !newPassword) {
      return res.status(400).json({ message: 'Valid email and new password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful! Please login.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
});

// 8) Google Sign-in (ID token)
router.post('/google', async (req, res) => {
  try {
    const { tokenId = '' } = req.body || {};
    if (!tokenId) return res.status(400).json({ message: 'Missing Google token' });

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub, email, name } = payload || {};
    if (!email) return res.status(400).json({ message: 'Unable to verify Google token' });

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        name: name || email,
        email: email.toLowerCase(),
        password: '',
        googleId: sub,
        isVerified: true
      });
      await user.save();
    }

    const token = signJwt({ id: user._id, name: user.name, email: user.email });
    return res.status(200).json({
      message: 'Google login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Google Login Error:', err);
    return res.status(500).json({ message: 'Google login failed' });
  }
});

module.exports = router;
