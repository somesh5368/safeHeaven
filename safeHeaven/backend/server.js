
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const jwt = require("jsonwebtoken");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const User = require('./models/User'); // make sure User model exists

const app = express();

// ================== MIDDLEWARE ==================
app.use(express.json());

// CORS: allow Authorization header + methods for preflight (no explicit app.options)
app.use(cors({
  origin: 'http://localhost:3000', // frontend URL
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
})); // Express CORS preflight handled automatically [web:171]

// No app.options('*', cors()) here — this breaks on Express 5/path-to-regexp [web:226][web:242]

app.use(passport.initialize()); // ✅ only initialize, no sessions

// ================== PASSPORT GOOGLE STRATEGY ==================
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: "", // Google users don’t need password
        googleId: profile.id
      });
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// ================== ROUTES ==================
app.use('/api/auth', require('./routes/auth')); // Auth router [web:114]
app.use("/api/emergency", require("./routes/emergency")); // Emergency contacts router [web:114]

// Google OAuth routes

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
); // Google OAuth start [web:114]

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login", session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, name: req.user.name, email: req.user.email, },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`http://localhost:3000/google-success?token=${token}`); // Redirect with JWT [web:153]
  }
);

app.get('/auth/logout', (req, res) => {
  res.json({ message: "Logged out. Please clear token on frontend." });
}); // Simple logout message [web:114]

app.get('/', (req, res) => {
  res.send('✅ SafeHeaven API is running...');
}); // Health check [web:114]



// ================== DATABASE ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
}); // Mongoose connect [web:114]

// ================== AUTH MIDDLEWARE ==================
const jwtVerify = (req, res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Auth failed" });
  }
}; // Granular JWT errors aid debugging [web:153][web:150]

// ================== TRIGGER ALERT ROUTE ==================
app.post(
  "/api/trigger-alert",
  (req, res, next) => {
    console.log("HIT /api/trigger-alert", {
      auth: req.headers.authorization,
      body: req.body
    });
    next();
  }, // Logger to confirm request reaches route [web:114]
  jwtVerify,
  (req, res) => {
    const { latitude, longitude, disaster } = req.body || {};
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "Latitude/Longitude must be numbers" });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Invalid coordinate bounds" });
    }

    const allowed = new Set(["earthquake", "flood", "cyclone", "tsunami"]);
    const type = (disaster || "").toLowerCase();
    if (!allowed.has(type)) {
      return res.status(400).json({ error: "Invalid disaster type" });
    }

    console.log("Manual alert trigger OK:", { lat, lng, disaster: type });
    return res.json({ ok: true, message: "Alert triggered", at: { lat, lng }, disaster: type });
  }
); // Trigger route with validation [web:114]

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)); // Start server [web:114]

