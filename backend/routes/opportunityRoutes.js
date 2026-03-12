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