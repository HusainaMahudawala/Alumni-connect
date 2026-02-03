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

    description: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["job", "internship", "referral", "hackathon"],
      required: true
    },

    company: String,

    deadline: Date,

    // ✅ ADD THIS HERE
    applicants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
