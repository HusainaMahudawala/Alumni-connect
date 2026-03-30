const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
  getUnreadCount,
  searchUsers,
  markAsRead,
  deleteMessage,
} = require("../controllers/messagesController");

// Send a message
router.post("/send", auth, sendMessage);

// Get messages
router.get("/", auth, getMessages);

// Get unread messages count
router.get("/unread", auth, getUnreadCount);

// Search users for chat
router.get("/users/search", auth, searchUsers);

// Mark message as read
router.put("/:messageId/read", auth, markAsRead);

// Delete a message
router.delete("/:messageId", auth, deleteMessage);

module.exports = router;
