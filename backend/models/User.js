const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["student", "alumni", "admin"],
      required: true
    },

    // Student-specific
    interests: [String],
    skills: [String],

    // Alumni-specific
    company: String,
    experience: Number,

    // Mentorship control
    mentorshipSlots: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
