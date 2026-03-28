const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

// Get all notifications for current user
router.get("/", authMiddleware, notificationController.getNotifications);

// Create notification (from backend only)
router.post("/", authMiddleware, notificationController.createNotification);

// Mark as read
router.patch("/mark-read", authMiddleware, notificationController.markAsRead);

// Delete notification
router.delete("/", authMiddleware, notificationController.deleteNotification);

module.exports = router;
