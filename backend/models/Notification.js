const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    type: {
      type: String,
      enum: [
        "mentorship_request",
        "mentorship_approved",
        "mentorship_rejected",
        "job_applied",
        "job_approved",
        "job_rejected",
        "connect_request",
        "collaboration_offer",
        "message_received",
        "event_unregistered"
      ],
      required: true
    },

    message: {
      type: String,
      required: true
    },

    data: {
      mentorshipId: mongoose.Schema.Types.ObjectId,
      jobId: mongoose.Schema.Types.ObjectId,
      fromUserId: mongoose.Schema.Types.ObjectId,
      fromUserName: String,
      jobTitle: String,
      actionUrl: String,
      isAction: Boolean,
      meetingLink: String,
      meetingDate: Date,
      meetingLocation: String
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
