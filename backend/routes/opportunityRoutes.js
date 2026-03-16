const express = require("express");
const router = express.Router();

const {
  createOpportunity,
  getAllOpportunities,
  applyOpportunity
} = require("../controllers/opportunityController");
const Opportunity = require("../models/Opportunity");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const verifyToken = require("../middleware/authMiddleware");

// Create opportunity (Alumni only)
router.post("/", auth, role("alumni"), createOpportunity);

// Get all opportunities (Students)
router.get("/", auth, role("student"), getAllOpportunities);

// Apply to opportunity (Student)
router.post("/apply/:id", auth, role("student"), applyOpportunity);



// GET opportunities student has applied to
router.get("/applied", auth, role("student"), async (req, res) => {
  try {
    // Handle mixed historical applicant formats (ObjectId/string/object)
    const allJobs = await Opportunity.find({ applicants: { $exists: true, $ne: [] } }).populate(
      "postedBy",
      "name email"
    );

    const studentId = String(req.user.id);
    const jobs = allJobs.filter((job) =>
      (job.applicants || []).some((a) => {
        if (!a) return false;
        if (typeof a === "string") return a === studentId;
        if (a.toString) return a.toString() === studentId;
        if (a._id) return String(a._id) === studentId;
        return false;
      })
    );

    res.json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET my opportunities (for alumni)
router.get("/my", verifyToken, async (req, res) => {
  try {

    const jobs = await Opportunity.find({ postedBy: req.user.id });

    res.json(jobs);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});


// UPDATE opportunity (alumni owner only)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const job = await Opportunity.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Opportunity not found" });
    if (job.postedBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const allowed = ["title", "company", "location", "salaryStipend", "type", "workMode", "description"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) job[field] = req.body[field];
    });
    await job.save();
    res.json(job);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE opportunity (alumni owner only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const job = await Opportunity.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Opportunity not found" });
    if (job.postedBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await job.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET applicants
router.get("/applicants", verifyToken, async (req, res) => {

  try {

    const jobs = await Opportunity
      .find({ postedBy: req.user.id })
      .populate("applicants");

    res.json(jobs);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }

});


module.exports = router;