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
app.use(cors({
  origin: 'http://localhost:3000', // frontend URL
  credentials: true
}));

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
app.use('/api/auth', require('./routes/auth'));

// Google login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
//For authentication
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login", session: false }),
  (req, res) => {
    // Generate JWT for frontend
    const token = jwt.sign(
      { id: req.user._id, name: req.user.name, email: req.user.email, },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Redirect back to frontend with token
    res.redirect(`http://localhost:3000/google-success?token=${token}`);
  }
);

// Logout (JWT-only → just tell client to delete token)
app.get('/auth/logout', (req, res) => {
  res.json({ message: "Logged out. Please clear token on frontend." });
});

// Health check
app.get('/', (req, res) => {
  res.send('✅ SafeHeaven API is running...');
});

// ================== DATABASE ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
