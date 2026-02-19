const Opportunity = require("../models/Opportunity");
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");

// Student Dashboard
exports.studentDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const appliedOpportunities = await Opportunity.countDocuments({
      "applicants.student": req.user.id
    });

    const mentorships = await Mentorship.find({ student: req.user.id });

    const pending = mentorships.filter(m => m.status === "pending").length;
    const approved = mentorships.filter(m => m.status === "approved").length;

    res.json({
      name: user.name,  // ✅ now real name from DB
      appliedOpportunities,
      pendingMentorships: pending,
      approvedMentorships: approved
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


// Alumni Dashboard
exports.alumniDashboard = async (req, res) => {
  try {
    const posted = await Opportunity.countDocuments({
      postedBy: req.user.id
    });

    const mentorships = await Mentorship.find({ alumni: req.user.id });

    const pending = mentorships.filter(m => m.status === "pending").length;
    const approved = mentorships.filter(m => m.status === "approved").length;

    res.json({
      postedOpportunities: posted,
      pendingRequests: pending,
      approvedMentorships: approved
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
