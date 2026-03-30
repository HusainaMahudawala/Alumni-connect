const Mentorship = require("../models/Mentorship");
const User = require("../models/User");
const Notification = require("../models/Notification");
const notificationController = require("./notificationController");

// Student sends mentorship request
exports.applyMentorship = async (req, res) => {
  try {
    const alumniId = req.params.alumniId;
    const { purpose } = req.body;   // ✅ ADD THIS

    if (!purpose)
      return res.status(400).json({ message: "Purpose is required" });

    const existing = await Mentorship.findOne({
      student: req.user.id,
      alumni: alumniId,
      status: "pending"
    });

    if (existing)
      return res.status(400).json({ message: "Already requested" });

    const alumni = await User.findById(alumniId).select("name role mentorshipSlots");
    const student = await User.findById(req.user.id).select("name");

    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ message: "Alumni not found" });
    }

    if ((alumni.mentorshipSlots || 0) <= 0) {
      return res.status(400).json({
        message: "You cannot request mentorship. Slot is not available."
      });
    }

    const mentorship = new Mentorship({
      student: req.user.id,
      alumni: alumniId,
      purpose,            // ✅ ADD THIS
      status: "pending"
    });

    await mentorship.save();

    // � DECREMENT ALUMNI'S MENTORSHIP SLOTS
    await User.findByIdAndUpdate(
      alumniId,
      { $inc: { mentorshipSlots: -1 } },
      { new: true }
    );

    // CREATE NOTIFICATION FOR ALUMNI (with deduplication to prevent duplicates)
    const recentNotif = await Notification.findOne({
      userId: alumniId,
      type: "mentorship_request",
      "data.mentorshipId": mentorship._id
    });

    if (!recentNotif) {
      await notificationController.createNotificationHelper(
        alumniId,
        "mentorship_request",
        `New mentorship request from ${student.name}`,
        {
          mentorshipId: mentorship._id,
          fromUserId: req.user.id,
          fromUserName: student.name
        }
      );
    }

    res.status(201).json({ message: "Mentorship request sent" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alumni views all requests
exports.viewRequests = async (req, res) => {
  try {
    const requests = await Mentorship.find({
      alumni: req.user.id
    }).populate("student", "name email");

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alumni updates status (approve / reject)
exports.updateStatus = async (req, res) => {
  try {
    const { status, meetingLink, meetingDate, meetingLocation } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const mentorship = await Mentorship.findById(req.params.id).populate("student", "name");

    if (!mentorship) {
      return res.status(404).json({ message: "Request not found" });
    }

    mentorship.status = status;

    // If approved, save meeting details
    if (status === "approved") {
      mentorship.meetingLink = meetingLink;
      mentorship.meetingDate = meetingDate;
      mentorship.meetingLocation = meetingLocation;

      // 🔔 CREATE NOTIFICATION FOR STUDENT (APPROVED)
      await notificationController.createNotificationHelper(
        mentorship.student._id,
        "mentorship_approved",
        "Your mentorship request has been approved!",
        {
          mentorshipId: mentorship._id,
          meetingLink: meetingLink,
          meetingDate: meetingDate,
          meetingLocation: meetingLocation
        }
      );
    } else if (status === "rejected") {
      // � RESTORE ALUMNI'S MENTORSHIP SLOT (was decremented on request)
      await User.findByIdAndUpdate(
        mentorship.alumni,
        { $inc: { mentorshipSlots: 1 } },
        { new: true }
      );

      // �🔔 CREATE NOTIFICATION FOR STUDENT (REJECTED)
      await notificationController.createNotificationHelper(
        mentorship.student._id,
        "mentorship_rejected",
        "Your mentorship request was rejected.",
        {
          mentorshipId: mentorship._id
        }
      );
    }

    await mentorship.save();

    res.json({ message: "Status updated successfully", mentorship });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student sees own mentorships
exports.myMentorships = async (req, res) => {
  try {
    const my = await Mentorship.find({
      student: req.user.id
    }).populate("alumni", "name email");

    res.json(my);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alumni sees approved mentorships
exports.approvedMentorships = async (req, res) => {
  try {
    const approved = await Mentorship.find({
      alumni: req.user.id,
      status: "approved"
    }).populate("student", "name email");

    res.json(approved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alumni gets current mentorship slots
exports.getMyMentorshipSlots = async (req, res) => {
  try {
    const alumni = await User.findOne({ _id: req.user.id, role: "alumni" }).select("mentorshipSlots");

    if (!alumni) {
      return res.status(404).json({ message: "Alumni not found" });
    }

    const slots = Number.isInteger(alumni.mentorshipSlots)
      ? alumni.mentorshipSlots
      : Number.parseInt(alumni.mentorshipSlots, 10) || 0;

    res.json({ mentorshipSlots: Math.max(0, slots) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alumni updates current mentorship slots (must be >= 1)
exports.updateMyMentorshipSlots = async (req, res) => {
  try {
    const parsedSlots = Number.parseInt(req.body?.mentorshipSlots, 10);

    if (!Number.isInteger(parsedSlots) || parsedSlots < 1) {
      return res.status(400).json({ message: "Mentorship slots must be at least 1" });
    }

    const alumni = await User.findOneAndUpdate(
      { _id: req.user.id, role: "alumni" },
      { $set: { mentorshipSlots: parsedSlots } },
      { new: true, runValidators: true }
    ).select("mentorshipSlots");

    if (!alumni) {
      return res.status(404).json({ message: "Alumni not found" });
    }

    res.json({
      message: "Mentorship slots updated successfully",
      mentorshipSlots: alumni.mentorshipSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin views all mentorship requests
exports.adminAllMentorshipRequests = async (req, res) => {
  try {
    const requests = await Mentorship.find({})
      .populate("student", "name email")
      .populate("alumni", "name email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch mentorship requests" });
  }
};