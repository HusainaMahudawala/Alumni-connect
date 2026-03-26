const Mentorship = require("../models/Mentorship");
const User = require("../models/User");

// Student sends mentorship request
exports.applyMentorship = async (req, res) => {
  try {
    const alumniId = req.params.alumniId;
    const { purpose } = req.body;   // ✅ ADD THIS

    if (!purpose)
      return res.status(400).json({ message: "Purpose is required" });

    const existing = await Mentorship.findOne({
      student: req.user.id,
      alumni: alumniId
    });

    if (existing)
      return res.status(400).json({ message: "Already requested" });

    const alumni = await User.findById(alumniId).select("role mentorshipSlots");

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
    const { status } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: "Request not found" });
    }

    mentorship.status = status;

    await mentorship.save();

    res.json({ message: "Status updated successfully" });

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