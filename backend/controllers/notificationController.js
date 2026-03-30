const Notification = require("../models/Notification");

// Get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const baseQuery = { userId: req.user.id };

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(baseQuery)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({ ...baseQuery, isRead: false })
    ]);

    res.json({
      success: true,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + notifications.length < totalCount,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create notification (called from other controllers)
exports.createNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create notifications"
      });
    }

    const { userId, type, message, data } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, type, and message are required"
      });
    }

    const notification = new Notification({
      userId,
      type,
      message,
      data: data || {}
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created",
      notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ success: false, message: "notificationId is required" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Marked as read", notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ success: false, message: "notificationId is required" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user.id
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ HELPER FUNCTIONS FOR OTHER CONTROLLERS ============

// Helper function to create notifications from other controllers
exports.createNotificationHelper = async (
  userId,
  type,
  message,
  data = {}
) => {
  try {
    const notification = new Notification({
      userId,
      type,
      message,
      data
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};

// Notify mentorship request
exports.notifyMentorshipRequest = async (alumniId, studentName, mentorshipId) => {
  return exports.createNotificationHelper(
    alumniId,
    "mentorship_request",
    `New mentorship request from ${studentName}`,
    { 
      mentorshipId,
      actionUrl: "/mentorship-requests",
      isAction: true
    }
  );
};

// Notify mentorship approved with meeting details
exports.notifyMentorshipApproved = async (
  studentId,
  alumniName,
  meetingLink,
  meetingDate,
  meetingLocation,
  mentorshipId
) => {
  return exports.createNotificationHelper(
    studentId,
    "mentorship_approved",
    `${alumniName} approved your mentorship request!`,
    {
      mentorshipId,
      meetingLink,
      meetingDate,
      meetingLocation,
      actionUrl: "/mentorship"
    }
  );
};

// Notify mentorship rejected
exports.notifyMentorshipRejected = async (studentId, alumniName, mentorshipId) => {
  return exports.createNotificationHelper(
    studentId,
    "mentorship_rejected",
    `${alumniName} declined your mentorship request`,
    { 
      mentorshipId,
      actionUrl: "/mentorship"
    }
  );
};

// Notify message received
exports.notifyMessageReceived = async (userId, senderName, messagePreview) => {
  return exports.createNotificationHelper(
    userId,
    "message_received",
    `New message from ${senderName}: ${messagePreview}`,
    { actionUrl: "/alumni-chat" }
  );
};

// Notify job applied
exports.notifyJobApplied = async (jobOwnerId, applicantName, jobTitle, jobId) => {
  return exports.createNotificationHelper(
    jobOwnerId,
    "job_applied",
    `${applicantName} applied for "${jobTitle}"`,
    { jobId, actionUrl: "/my-opportunities" }
  );
};

// Notify alumni when their opportunity is approved
exports.notifyJobApproved = async (jobOwnerId, jobTitle, jobId) => {
  return exports.createNotificationHelper(
    jobOwnerId,
    "job_approved",
    `Your opportunity "${jobTitle}" has been approved by admin`,
    { jobId, jobTitle, actionUrl: "/my-opportunities" }
  );
};

// Notify alumni when their opportunity is rejected
exports.notifyJobRejected = async (jobOwnerId, jobTitle, jobId) => {
  return exports.createNotificationHelper(
    jobOwnerId,
    "job_rejected",
    `Your opportunity "${jobTitle}" was rejected by admin`,
    { jobId, jobTitle, actionUrl: "/my-opportunities" }
  );
};

// Notify alumni when their opportunity is deleted by admin
exports.notifyJobDeleted = async (jobOwnerId, jobTitle, jobId) => {
  return exports.createNotificationHelper(
    jobOwnerId,
    "job_deleted",
    `Your opportunity "${jobTitle}" has been deleted by admin`,
    { jobId, jobTitle, actionUrl: "/my-opportunities" }
  );
};

// Keep only one latest moderation notification per opportunity for the alumni.
exports.replaceOpportunityModerationNotification = async (
  jobOwnerId,
  type,
  message,
  jobId,
  jobTitle
) => {
  try {
    await Notification.deleteMany({
      userId: jobOwnerId,
      "data.jobId": jobId,
      type: { $in: ["job_approved", "job_rejected", "job_deleted"] }
    });

    return exports.createNotificationHelper(
      jobOwnerId,
      type,
      message,
      { jobId, jobTitle, actionUrl: "/my-opportunities" }
    );
  } catch (error) {
    console.error("Error replacing opportunity moderation notification:", error.message);
    return null;
  }
};

// Notify connection request
exports.notifyConnectionRequest = async (userId, requesterId, requesterName) => {
  return exports.createNotificationHelper(
    userId,
    "connect_request",
    `${requesterName} sent you a connection request`,
    { 
      fromUserId: requesterId,
      fromUserName: requesterName
    }
  );
};

// Notify collaboration offer
exports.notifyCollaborationOffer = async (userId, fromUserId, fromUserName, projectTitle) => {
  return exports.createNotificationHelper(
    userId,
    "collaboration_offer",
    `${fromUserName} invited you to collaborate on "${projectTitle}"`,
    { 
      fromUserId,
      fromUserName
    }
  );
};
