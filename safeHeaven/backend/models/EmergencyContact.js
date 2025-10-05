
const mongoose = require("mongoose");

const EmergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String }, // email added here
  phone: { type: String, required: true },
  relation: { type: String },
});

module.exports = mongoose.model("EmergencyContact", EmergencyContactSchema);
