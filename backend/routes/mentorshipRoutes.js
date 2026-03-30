const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  applyMentorship,
  viewRequests,
  updateStatus,
  myMentorships,
  approvedMentorships,
  getMyMentorshipSlots,
  updateMyMentorshipSlots,
  adminAllMentorshipRequests
} = require("../controllers/mentorshipController");
// Student sends mentorship request
router.post(
  "/request",
  auth,
  role(["student"]),
  (req, res, next) => {
    const { alumniId } = req.body || {};

    if (!alumniId) {
      return res.status(400).json({ message: "alumniId is required" });
    }

    req.params.alumniId = alumniId;
    return applyMentorship(req, res, next);
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
router.get("/slots/me", auth, role("alumni"), getMyMentorshipSlots);
router.put("/slots/me", auth, role("alumni"), updateMyMentorshipSlots);

// Admin
router.get("/admin/all", auth, role("admin"), adminAllMentorshipRequests);



module.exports = router;
