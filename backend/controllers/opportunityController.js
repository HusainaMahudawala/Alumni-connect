const Opportunity = require("../models/Opportunity");
const OpportunityReport = require("../models/OpportunityReport");
const User = require("../models/User");
const notificationController = require("./notificationController");

// Create Opportunity
exports.createOpportunity = async (req, res) => {
  try {
    const parseCSV = (value) =>
      (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const {
      title,
      company,
      location,
      type,
      workMode,
      salaryStipend,
      overview,
      responsibilities,
      requiredSkills,
      preferredSkills
    } = req.body;

    const opportunity = new Opportunity({
      title,
      company,
      location,
      type,
      workMode,
      salaryStipend,
      overview,
      responsibilities: parseCSV(responsibilities),
      requiredSkills: parseCSV(requiredSkills),
      preferredSkills: parseCSV(preferredSkills),
      postedBy: req.user.id,
      status: "pending"
    });

    await opportunity.save();

    res.status(201).json({
      message: "Opportunity submitted for admin approval",
      opportunity
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Opportunities
exports.getAllOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ status: "approved" }).populate(
      "postedBy",
      "name email"
    );

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply to Opportunity
exports.applyOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).populate("postedBy", "name");

    if (!opportunity)
      return res.status(404).json({ message: "Opportunity not found" });

    if (opportunity.status !== "approved") {
      return res.status(400).json({ message: "Only approved opportunities can be applied to" });
    }

    // ✅ Correct duplicate check
    const alreadyApplied = opportunity.applicants.some(
      (applicantId) => applicantId.toString() === req.user.id
    );

    if (alreadyApplied)
      return res.status(400).json({ message: "Already applied" });

    const student = await User.findById(req.user.id).select("name");

    // ✅ Push only user id (NOT object)
    opportunity.applicants.push(req.user.id);

    await opportunity.save();

    // 🔔 CREATE NOTIFICATION FOR ALUMNI/POSTER
    await notificationController.createNotificationHelper(
      opportunity.postedBy._id,
      "job_applied",
      `${student.name} applied for "${opportunity.title}"`,
      {
        jobId: opportunity._id,
        jobTitle: opportunity.title,
        fromUserId: req.user.id,
        fromUserName: student.name
      }
    );

    res.json({ message: "Applied successfully" });

  } catch (error) {
    console.log(error); // helpful for debugging
    res.status(500).json({ message: error.message });
  }
};

// Admin: list opportunities for management
exports.getAllOpportunitiesForAdmin = async (req, res) => {
  try {
    const opportunities = await Opportunity.find()
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch opportunities" });
  }
};

// Admin: approve/reject opportunity
exports.updateOpportunityStatusByAdmin = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).populate("postedBy", "name email");

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.json({ message: `Opportunity ${status} successfully`, opportunity });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update opportunity status" });
  }
};

// Admin: delete opportunity
exports.deleteOpportunityByAdmin = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    await opportunity.deleteOne();
    res.json({ message: "Opportunity deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete opportunity" });
  }
};

// Student: report an opportunity with reason
exports.reportOpportunity = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    const existingPendingReport = await OpportunityReport.findOne({
      opportunity: opportunity._id,
      reportedBy: req.user.id,
      status: "pending"
    });

    if (existingPendingReport) {
      return res.status(400).json({ message: "You have already reported this opportunity" });
    }

    const report = await OpportunityReport.create({
      opportunity: opportunity._id,
      reportedBy: req.user.id,
      reason: reason.trim()
    });

    res.status(201).json({
      message: "Report submitted successfully",
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to submit report" });
  }
};

// Admin: list opportunity reports
exports.getOpportunityReportsForAdmin = async (req, res) => {
  try {
    const reports = await OpportunityReport.find({})
      .populate("opportunity", "title company status")
      .populate("reportedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch reports" });
  }
};

// Admin: review report and take action on opportunity
exports.reviewOpportunityReportByAdmin = async (req, res) => {
  try {
    const { decision } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision value" });
    }

    const report = await OpportunityReport.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status !== "pending") {
      return res.status(400).json({ message: "This report has already been reviewed" });
    }

    const opportunity = await Opportunity.findById(report.opportunity);
    if (!opportunity) {
      return res.status(404).json({ message: "Related opportunity not found" });
    }

    opportunity.status = decision;
    await opportunity.save();

    const reviewedAt = new Date();

    await OpportunityReport.updateMany(
      { opportunity: report.opportunity, status: "pending" },
      {
        $set: {
          status: "reviewed",
          reviewDecision: decision,
          reviewedBy: req.user.id,
          reviewedAt
        }
      }
    );

    const updatedReport = await OpportunityReport.findById(report._id)
      .populate("opportunity", "title company status")
      .populate("reportedBy", "name email")
      .populate("reviewedBy", "name email");

    res.json({
      message: `Report reviewed and opportunity ${decision}`,
      report: updatedReport,
      opportunity
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to review report" });
  }
};