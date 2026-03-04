const Opportunity = require("../models/Opportunity");

// Create Opportunity
exports.createOpportunity = async (req, res) => {
  try {
    const { title, description } = req.body;

    const opportunity = new Opportunity({
      title,
      description,
      postedBy: req.user.id
    });

    await opportunity.save();

    res.status(201).json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Opportunities
exports.getAllOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find().populate(
      "postedBy",
      "name email"
    );

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply to Opportunity
// Apply to Opportunity
exports.applyOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity)
      return res.status(404).json({ message: "Opportunity not found" });

    // ✅ Correct duplicate check
    const alreadyApplied = opportunity.applicants.some(
      (applicantId) => applicantId.toString() === req.user.id
    );

    if (alreadyApplied)
      return res.status(400).json({ message: "Already applied" });

    // ✅ Push only user id (NOT object)
    opportunity.applicants.push(req.user.id);

    await opportunity.save();

    res.json({ message: "Applied successfully" });

  } catch (error) {
    console.log(error); // helpful for debugging
    res.status(500).json({ message: error.message });
  }
};