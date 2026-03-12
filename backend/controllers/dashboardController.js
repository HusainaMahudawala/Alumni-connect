const Opportunity = require("../models/Opportunity");
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");

// Student Dashboard


exports.studentDashboard = async (req, res) => {
  try {
    // ✅ FIXED COUNT
   const user = await User.findById(req.user.id);
    const appliedOpportunities = await Opportunity.countDocuments({
      applicants: req.user.id
    });

    const mentorships = await Mentorship.find({
      student: req.user.id
    });

    const pending = mentorships.filter(
      (m) => m.status === "pending"
    ).length;

    const approved = mentorships.filter(
      (m) => m.status === "approved"
    ).length;

    const rejected = mentorships.filter(
      (m) => m.status === "rejected"
    ).length;

    const availableOpportunities = await Opportunity.countDocuments({});

    res.json({
      name: user.name,
      email: user.email,
      appliedOpportunities,
      pendingMentorships: pending,
      approvedMentorships: approved,
      availableOpportunities,
      rejectedMentorships: rejected
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};


// Alumni Dashboard
exports.alumniDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");

    const posted = await Opportunity.countDocuments({
      postedBy: req.user.id
    });

    const mentorships = await Mentorship.find({ alumni: req.user.id });

    const pending = mentorships.filter(m => m.status === "pending").length;
    const approved = mentorships.filter(m => m.status === "approved").length;

    res.json({
      name: user?.name || "Alumni",
      email: user?.email || "",
      postedOpportunities: posted,
      pendingRequests: pending,
      approvedMentorships: approved
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
