const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    organizerName: {
      type: String
    },

    eventType: {
      type: String,
      enum: ["mentorship", "workshop", "networking", "webinar", "panel", "hackathon", "other"],
      default: "other"
    },

    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online"
    },

    location: {
      type: String
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    meetingLink: {
      type: String
    },

    capacity: {
      type: Number,
      default: 100
    },

    registrants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    tags: [String],

    isFeatured: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming"
    },

    image: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
