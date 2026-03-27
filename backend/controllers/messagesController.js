const Message = require("../models/Message");
const User = require("../models/User");
const notificationController = require("./notificationController");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    console.log("Message request received:", { senderId, recipientId, content });

    // Validate input
    if (!recipientId || !content) {
      return res.status(400).json({ message: "Recipient ID and content are required" });
    }

    if (String(recipientId) === String(senderId)) {
      return res.status(400).json({ message: "You cannot send a message to yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Create message
    const message = new Message({
      senderId,
      senderName: sender.name,
      recipientId,
      recipientName: recipient.name,
      content,
      isRead: false,
    });

    await message.save();
    console.log("Message saved successfully:", message._id);

    await notificationController.createNotificationHelper(
      recipientId,
      "message_received",
      `New message from ${sender.name}`,
      {
        fromUserId: senderId,
        fromUserName: sender.name
      }
    );

    res.status(201).json({ 
      message: "Message sent successfully",
      data: message 
    });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get messages for a user (both sent and received)
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherId } = req.query; // Get messages with a specific person

    let query = {
      $or: [
        { senderId: userId },
        { recipientId: userId },
      ],
    };

    if (otherId) {
      query = {
        $or: [
          { senderId: userId, recipientId: otherId },
          { senderId: otherId, recipientId: userId },
        ],
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email');

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get unread messages count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ message: err.message });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message marked as read", data: message });
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is sender or recipient
    if (message.senderId.toString() !== userId && message.recipientId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ message: err.message });
  }
};
