const express = require("express");
const router = express.Router();

const { studentDashboard, alumniDashboard } = require("../controllers/dashboardController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Student
router.get("/student", auth, role("student"), studentDashboard);

// Alumni
router.get("/alumni", auth, role("alumni"), alumniDashboard);

module.exports = router;
