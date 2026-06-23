const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tag name is required"],
    unique: true,
    enum: [
      "Hot Lead",
      "Warm Lead",
      "Cold Lead",
      "Re-engage",
      "Not Interested",
      "Call Scheduled",
      "Tag-1780469753001",
      "Tag-1780489653088",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Tag", tagSchema);
