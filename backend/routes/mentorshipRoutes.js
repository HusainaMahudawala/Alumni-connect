const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");
const {
  applyMentorship,
  viewRequests,
  updateStatus,
  myMentorships,
  approvedMentorships,
  adminAllMentorshipRequests
} = require("../controllers/mentorshipController");
// Student sends mentorship request
router.post(
  "/request",
  auth,
  role(["student"]),
  async (req, res) => {
    try {
      const { alumniId, purpose } = req.body;

      const alumni = await User.findById(alumniId).select("role mentorshipSlots");
      if (!alumni || alumni.role !== "alumni") {
        return res.status(404).json({ message: "Alumni not found" });
      }

      if ((alumni.mentorshipSlots || 0) <= 0) {
        return res.status(400).json({
          message: "You cannot request mentorship. Slot is not available."
        });
      }

      const request = new Mentorship({
        student: req.user.id,
        alumni: alumniId,
        purpose
      });

      await request.save();
      res.status(201).json({ message: "Mentorship request sent" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);




// Student
router.post("/apply/:alumniId", auth, role("student"), applyMentorship);

// Alumni
router.get("/", auth, role(["alumni"]), viewRequests);
router.get("/requests", auth, role("alumni"), viewRequests);
router.put("/update/:id", auth, role("alumni"), updateStatus);
// Student
router.get(
  "/my",
  auth,
  role("student"),
  myMentorships
);

// Alumni
router.get(
  "/approved",
  auth,
  role("alumni"),
  approvedMentorships
);

// Admin
router.get("/admin/all", auth, role("admin"), adminAllMentorshipRequests);



module.exports = router;
