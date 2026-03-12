const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    company: {
      type: String,
      required: true
    },

    location: {
      type: String
    },

    type: {
      type: String,
      enum: ["full-time", "internship", "part-time", "contract"],
      default: "full-time"
    },

    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      default: "onsite"
    },

    overview: String,

    responsibilities: [String],

    requiredSkills: [String],

    preferredSkills: [String],

    applicants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);