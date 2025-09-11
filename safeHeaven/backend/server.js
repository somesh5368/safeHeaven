const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ================== MIDDLEWARE ==================
app.use(express.json()); // for JSON bodies
app.use(cors());         // allow cross-origin requests

// ================== ROUTES ==================
app.use('/api/auth', require('./routes/auth'));

// Health check route (optional but useful)
app.get('/', (req, res) => {
  res.send('✅ SafeHeaven API is running...');
});

// ================== DATABASE CONNECTION ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1); // Stop server if DB fails
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
