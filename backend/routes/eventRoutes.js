const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");
const Mentorship = require("../models/Mentorship");

// Optional auth middleware — attaches user if token present, continues either way
const optionalAuth = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return next();
  const token = authHeader.split(" ")[1];
  if (!token) return next();
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (_) {
    // invalid token — continue as unauthenticated
  }
  next();
};

// Debug endpoint
router.get("/debug/mentorships", async (req, res) => {
  try {
    const now = new Date();
    const all = await Mentorship.countDocuments();
    const approved = await Mentorship.countDocuments({ status: "approved" });
    const future = await Mentorship.countDocuments({ status: "approved", meetingDate: { $gte: now } });
    const examples = await Mentorship.find({ status: "approved" }).limit(2).populate("student", "name").populate("alumni", "name");
    res.json({
      debug: {
        totalMentorships: all,
        approvedCount: approved,
        futureApprovedCount: future,
        now: now.toISOString(),
        examples: examples.map(m => ({
          _id: m._id,
          status: m.status,
          purpose: m.purpose,
          meetingDate: m.meetingDate,
          meetingLink: m.meetingLink,
          student: m.student?.name,
          alumni: m.alumni?.name
        }))
      }
    });
  } catch (error) {
    res.json({ debug: { error: error.message } });
  }
});

// ── Public / optional-auth routes ──────────────────────────────────────────
// IMPORTANT: /my/* routes MUST be registered BEFORE /:eventId to avoid shadowing
router.get("/featured", optionalAuth, eventController.getFeaturedEvent);
router.get("/", optionalAuth, eventController.getAllEvents);

// ── Protected routes ────────────────────────────────────────────────────────
router.use(authMiddleware);

// Specific named routes BEFORE the generic /:eventId wildcard
router.get("/my/registered", eventController.getMyRegisteredEvents);
router.get("/my/organized", eventController.getMyOrganizedEvents);

// Create event (alumni)
router.post("/", eventController.createEvent);

// Register for event
router.post("/:eventId/register", eventController.registerEvent);

// Unregister from event
router.delete("/:eventId/register", eventController.unregisterEvent);

// Update event (organizer)
router.put("/:eventId", eventController.updateEvent);

// Delete event (organizer)
router.delete("/:eventId", eventController.deleteEvent);

// Get single event details — kept LAST so it doesn't shadow /my/* routes
router.get("/:eventId", eventController.getEventDetails);

module.exports = router;
