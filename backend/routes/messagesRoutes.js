const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
  getUnreadCount,
  markAsRead,
  deleteMessage,
} = require("../controllers/messagesController");

// Send a message
router.post("/send", auth, sendMessage);

// Get messages
router.get("/", auth, getMessages);

// Get unread messages count
router.get("/unread", auth, getUnreadCount);

// Mark message as read
router.put("/:messageId/read", auth, markAsRead);

// Delete a message
router.delete("/:messageId", auth, deleteMessage);

module.exports = router;
