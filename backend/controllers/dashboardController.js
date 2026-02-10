const Opportunity = require("../models/Opportunity");
const Mentorship = require("../models/Mentorship");

exports.studentDashboard = async (req, res) => {
  try {
    const appliedOpportunities = await Opportunity.countDocuments({
      "applicants.student": req.user.id
    });

    const mentorships = await Mentorship.find({ student: req.user.id });
    const pending = mentorships.filter(m => m.status === "pending").length;
    const approved = mentorships.filter(m => m.status === "approved").length;

    res.json({ appliedOpportunities, pendingMentorships: pending, approvedMentorships: approved });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.alumniDashboard = async (req, res) => {
  try {
    const posted = await Opportunity.countDocuments({ postedBy: req.user.id });

    const mentorships = await Mentorship.find({ alumni: req.user.id });
    const pending = mentorships.filter(m => m.status === "pending").length;
    const approved = mentorships.filter(m => m.status === "approved").length;

    res.json({ postedOpportunities: posted, pendingRequests: pending, approvedMentorships: approved });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
