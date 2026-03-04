const express = require("express");
const router = express.Router();

const {
  createOpportunity,
  getAllOpportunities,
  applyOpportunity
} = require("../controllers/opportunityController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Create opportunity (Alumni only)
router.post("/", auth, role("alumni"), createOpportunity);

// Get all opportunities (Students)
router.get("/", auth, role("student"), getAllOpportunities);

// Apply to opportunity (Student)
router.post("/apply/:id", auth, role("student"), applyOpportunity);

module.exports = router;