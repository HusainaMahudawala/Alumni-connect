const Opportunity = require("../models/Opportunity");

// Apply for Opportunity (Student)
exports.applyOpportunity = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const studentId = req.user.id;

    const opportunity = await Opportunity.findById(opportunityId);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    // Prevent duplicate application
    if (opportunity.applicants.includes(studentId)) {
      return res.status(400).json({ message: "Already applied" });
    }

    opportunity.applicants.push(studentId);
    await opportunity.save();

    res.status(200).json({ message: "Applied successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.viewApplicants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const opportunity = await Opportunity.findById(req.params.id)
      .populate({
        path: "applicants.student",
        select: "name email"
      });

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    if (opportunity.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const total = opportunity.applicants.length;

    const applicants = opportunity.applicants
      .sort((a, b) => b.appliedAt - a.appliedAt)
      .slice(skip, skip + limit);

    res.json({
      totalApplicants: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      applicants
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


