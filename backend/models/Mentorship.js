const mongoose = require("mongoose");

const mentorshipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    purpose: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },

    scheduledTime: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mentorship", mentorshipSchema);
