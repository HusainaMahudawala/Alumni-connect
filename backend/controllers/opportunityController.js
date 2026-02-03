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
    const opportunity = await Opportunity.findById(req.params.id)
      .populate("applicants", "name email role");

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.status(200).json(opportunity.applicants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

