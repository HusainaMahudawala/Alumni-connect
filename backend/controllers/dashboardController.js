const Opportunity = require("../models/Opportunity");
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");
const Post = require("../models/Post");
const Message = require("../models/Message");

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

    const availableOpportunities = await Opportunity.countDocuments({ status: "approved" });

    res.json({
      _id: user._id,
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

// Admin Dashboard
exports.adminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAlumni,
      totalAdmins,
      totalOpportunities,
      pendingOpportunities,
      totalMentorshipRequests,
      totalPosts,
      totalMessages
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "alumni" }),
      User.countDocuments({ role: "admin" }),
      Opportunity.countDocuments({}),
      Opportunity.countDocuments({ status: "pending" }),
      Mentorship.countDocuments({}),
      Post.countDocuments({}),
      Message.countDocuments({})
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalAlumni,
      totalAdmins,
      totalOpportunities,
      pendingOpportunities,
      totalMentorshipRequests,
      totalPosts,
      totalMessages
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to load admin dashboard" });
  }
};
