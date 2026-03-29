const Event = require("../models/Event");
const User = require("../models/User");
const Mentorship = require("../models/Mentorship");

// ── Helpers ──────────────────────────────────────────────────────────────────

// Transform approved mentorship into event-like object (private — only for /my/registered)
const transformMentorshipToEvent = (mentorship, userId) => {
  const now = new Date();
  const meetingDate = new Date(mentorship.meetingDate);
  const endDate = new Date(meetingDate.getTime() + 60 * 60 * 1000); // 1 hour

  let status = "upcoming";
  if (meetingDate <= now && endDate > now) status = "ongoing";
  else if (endDate <= now) status = "completed";

  return {
    _id: `mentorship_${mentorship._id}`,
    title: `Mentorship Session: ${mentorship.purpose || "1-on-1 session"}`,
    description: `Private 1-on-1 mentorship session`,
    organizer: mentorship.alumni._id,
    organizerName: mentorship.alumni.name,
    eventType: "mentorship",
    mode: mentorship.meetingLink ? "online" : (mentorship.meetingLocation ? "offline" : "hybrid"),
    location: mentorship.meetingLocation || null,
    startDate: mentorship.meetingDate,
    endDate,
    meetingLink: mentorship.meetingLink || null,
    capacity: 2,
    registrants: [mentorship.student._id, mentorship.alumni._id],
    tags: ["mentorship", "1-on-1", "private"],
    isFeatured: false,
    status,
    createdAt: mentorship.createdAt,
    updatedAt: mentorship.updatedAt,
    isMentorshipSession: true,
    mentorshipId: mentorship._id,
    isRegistered: true // user is always a participant of their own mentorship
  };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/events
 * Returns all upcoming public events.
 * If authenticated (optionalAuth), attaches isRegistered flag per event.
 * Does NOT include private mentorship sessions — those appear only in /my/registered.
 */
exports.getAllEvents = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user?.id || null;

    const events = await Event.find({
      status: { $in: ["upcoming", "ongoing"] },
      startDate: { $gte: now }
    })
      .populate("organizer", "name email")
      .sort({ startDate: 1 })
      .limit(50);

    // Attach isRegistered flag for the logged-in user
    const eventsWithFlag = events.map(ev => {
      const plain = ev.toObject();
      plain.isRegistered = userId
        ? ev.registrants.some(r => r.toString() === userId)
        : false;
      return plain;
    });

    console.log(`📅 [getAllEvents] user=${userId || "anonymous"}, events=${events.length}`);

    res.json({
      success: true,
      count: eventsWithFlag.length,
      events: eventsWithFlag
    });
  } catch (error) {
    console.error("❌ [getAllEvents] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events/featured
 * Returns the featured upcoming public event.
 * Does NOT expose private mentorship sessions.
 */
exports.getFeaturedEvent = async (req, res) => {
  try {
    const userId = req.user?.id || null;

    const featured = await Event.findOne({
      isFeatured: true,
      status: { $in: ["upcoming", "ongoing"] }
    })
      .populate("organizer", "name email")
      .sort({ startDate: 1 });

    if (!featured) {
      return res.json({ success: true, event: null });
    }

    const plain = featured.toObject();
    plain.isRegistered = userId
      ? featured.registrants.some(r => r.toString() === userId)
      : false;

    res.json({ success: true, event: plain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events/my/registered  (requires auth)
 * Returns events the current user has registered for PLUS their approved mentorship sessions.
 * This is fully user-specific — other users never see these.
 */
exports.getMyRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Public events the user registered for
    const registeredEvents = await Event.find({
      registrants: userId
    })
      .populate("organizer", "name email")
      .sort({ startDate: 1 });

    const registeredWithFlag = registeredEvents.map(ev => {
      const plain = ev.toObject();
      plain.isRegistered = true;
      return plain;
    });

    // Private mentorship sessions involving this user
    const mentorships = await Mentorship.find({
      status: "approved",
      $or: [{ student: userId }, { alumni: userId }]
    })
      .populate("student", "name email")
      .populate("alumni", "name email")
      .sort({ meetingDate: 1 });

    const mentorshipEvents = mentorships.map(m => transformMentorshipToEvent(m, userId));

    const allEvents = [...registeredWithFlag, ...mentorshipEvents].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );

    res.json({
      success: true,
      count: allEvents.length,
      events: allEvents
    });
  } catch (error) {
    console.error("❌ [getMyRegisteredEvents] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events/my/organized  (requires auth)
 * Returns events organized by the current user (alumni).
 */
exports.getMyOrganizedEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({
      organizer: userId
    })
      .populate("registrants", "name email")
      .sort({ startDate: -1 });

    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events/:eventId  (requires auth)
 */
exports.getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id || null;

    const event = await Event.findById(eventId)
      .populate("organizer", "name email")
      .populate("registrants", "name email");

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const plain = event.toObject();
    plain.isRegistered = userId
      ? event.registrants.some(r => (r._id || r).toString() === userId)
      : false;

    res.json({ success: true, event: plain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/events  (requires auth — alumni)
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, eventType, mode, location,
      startDate, endDate, meetingLink, capacity, tags, isFeatured
    } = req.body;

    const user = await User.findById(req.user.id).select("name");

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Title, start date, and end date are required" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: "Start date must be before end date" });
    }

    const event = new Event({
      title, description,
      organizer: req.user.id,
      organizerName: user.name,
      eventType, mode, location,
      startDate, endDate, meetingLink,
      capacity: capacity || 100,
      tags: tags || [],
      isFeatured: isFeatured || false
    });

    await event.save();
    await event.populate("organizer", "name email");

    res.status(201).json({ success: true, message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/events/:eventId/register  (requires auth)
 */
exports.registerEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (event.registrants.some(r => r.toString() === userId)) {
      return res.status(400).json({ success: false, message: "Already registered for this event" });
    }

    if (event.registrants.length >= event.capacity) {
      return res.status(400).json({ success: false, message: "Event is full" });
    }

    event.registrants.push(userId);
    await event.save();

    res.json({ success: true, message: "Registered for event successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/events/:eventId/register  (requires auth)
 */
exports.unregisterEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    event.registrants = event.registrants.filter(id => id.toString() !== userId);
    await event.save();

    res.json({ success: true, message: "Unregistered from event successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/events/:eventId  (requires auth — organizer only)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (event.organizer.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You can only edit your own events" });
    }

    const updateableFields = [
      "title", "description", "eventType", "mode", "location",
      "startDate", "endDate", "meetingLink", "capacity", "tags", "isFeatured", "status"
    ];

    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    await event.save();
    res.json({ success: true, message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/events/:eventId  (requires auth — organizer only)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (event.organizer.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own events" });
    }

    await event.deleteOne();
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
