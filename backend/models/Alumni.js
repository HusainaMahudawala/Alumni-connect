const mongoose = require("mongoose");

const alumniSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    profilePicture: {
      type: String,
      default: ""
    },
    graduationYear: {
      type: Number
    },
    degree: {
      type: String,
      default: ""
    },
    currentCompany: {
      type: String,
      default: ""
    },
    jobTitle: {
      type: String,
      default: ""
    },
    industry: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    skills: {
      type: [String],
      default: []
    },
    linkedin: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    experience: {
      type: mongoose.Schema.Types.Mixed,
      default: ""
    },
    careerJourney: {
      type: String,
      default: ""
    },
    connections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alumni", alumniSchema);
