const Notification = require("../models/Notification");

// Get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create notification (called from other controllers)
exports.createNotification = async (req, res) => {
  try {
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

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
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

    const notification = await Notification.findByIdAndDelete(notificationId);

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
