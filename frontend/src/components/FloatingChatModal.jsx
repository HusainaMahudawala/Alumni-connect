import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/FloatingChat.css";

const FloatingChatModal = () => {
  const [showChat, setShowChat] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Total unread count
  const [showMessageInfo, setShowMessageInfo] = useState(null); // Message ID to show info for on hover
  const [messageInfoModal, setMessageInfoModal] = useState(null); // Message object for info modal
  
  // Initialize button at bottom-right
  const [position, setPosition] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 90, y: window.innerHeight - 90 };
    }
    return { x: 0, y: 0 };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const buttonRef = useRef(null);

  const token = localStorage.getItem("token");
  
  // Extract userId from stored user object - this is the source of truth from login
  let userId = null;
  let userName = "User";
  
  const userJson = localStorage.getItem("user");
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      // Use id from user object (source of truth from login)
      userId = userData.id || userData._id;
      userName = userData.name || userName;
      console.log("✅ Extracted userId from user object:", userId);
      console.log("✅ Extracted userName:", userName);
    } catch (e) {
      console.error("❌ Error parsing user data:", e);
    }
  } else {
    console.warn("⚠️ No user object found in localStorage");
  }
  
  // Fallback to separate fields if user object not available (for backward compatibility)
  if (!userId) {
    userId = localStorage.getItem("userId");
    userName = localStorage.getItem("userName") || userName;
    console.log("⚠️ Using fallback userId from localStorage:", userId);
  }
  
  console.log("📱 Final userId for this session:", userId);
  
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Fetch conversations
  useEffect(() => {
    if (!showChat || !token) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/api/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("=== CONVERSATION FETCH DEBUG ===");
        console.log("API URL:", apiUrl);
        console.log("Token:", token ? "✓ Present" : "❌ MISSING");
        console.log("Current User ID:", userId);
        console.log("Current User Name:", userName);
        console.log("All localStorage keys:", Object.keys(localStorage));
        console.log("localStorage.userId:", localStorage.getItem("userId"));
        console.log("localStorage.userName:", localStorage.getItem("userName"));
        console.log("Raw API Response Total Messages:", response.data.length);
        
        if (response.data.length === 0) {
          console.warn("⚠️ API RETURNED 0 MESSAGES!");
          console.warn("This means either:");
          console.warn("1. You have no messages in the database");
          console.warn("2. The token is invalid/expired");
          console.warn("3. The backend is not running correctly");
          console.warn("Token:", token);
          console.warn("API URL:", apiUrl);
        }
        
        console.table(response.data.map(m => ({
          id: m._id,
          senderId: typeof m.senderId === 'object' ? m.senderId._id : m.senderId,
          senderName: m.senderName || m.senderId,
          recipientId: typeof m.recipientId === 'object' ? m.recipientId._id : m.recipientId,
          recipientName: m.recipientName || m.recipientId,
          content: m.content.substring(0, 30),
          createdAt: m.createdAt
        })));

        // Group messages into conversations with OTHER users only
        const convMap = new Map();
        const seenIds = new Set();
        let processedCount = 0;
        let skippedCount = 0;

        response.data.forEach((msg) => {
          // Safety check: skip if message doesn't have required fields
          if (!msg.senderId || !msg.recipientId) {
            console.log("❌ Skipping - missing IDs:", msg);
            skippedCount++;
            return;
          }

          // Handle both string IDs and populated objects
          const senderIdValue = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
          const recipientIdValue = typeof msg.recipientId === 'object' ? msg.recipientId._id : msg.recipientId;

          // Determine who the "other" person is
          let otherId = null;
          let otherName = null;

          if (String(senderIdValue) === String(userId) && String(recipientIdValue) !== String(userId)) {
            // I sent this message
            otherId = recipientIdValue;
            otherName = msg.recipientName;
          } else if (String(recipientIdValue) === String(userId) && String(senderIdValue) !== String(userId)) {
            // I received this message
            otherId = senderIdValue;
            otherName = msg.senderName;
          } else {
            // Skip self-messages (both sender and recipient are same user)
            skippedCount++;
            return;
          }

          // Additional safety: skip if otherId is still us
          if (String(otherId) === String(userId) || !otherId) {
            skippedCount++;
            return;
          }

          // Check if this is an unread message (received and not read)
          const isUnreadMessage = !msg.isRead && String(recipientIdValue) === String(userId);

          // Skip if we've already processed this user
          if (seenIds.has(String(otherId))) {
            // Update last message if newer
            const existing = convMap.get(String(otherId));
            if (existing && new Date(msg.createdAt) > new Date(existing.timestamp)) {
              existing.lastMessage = msg.content;
              existing.timestamp = msg.createdAt;
              // Update unread count
              if (isUnreadMessage) {
                existing.unreadCount = (existing.unreadCount || 0) + 1;
              }
            }
            return;
          }

          // Record this conversation
          seenIds.add(String(otherId));
          convMap.set(String(otherId), {
            userId: String(otherId),
            name: otherName || "Unknown User",
            lastMessage: msg.content,
            timestamp: msg.createdAt,
            unreadCount: isUnreadMessage ? 1 : 0,
          });
          processedCount++;
        });

        // Sort by most recent
        const convList = Array.from(convMap.values()).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        // Calculate total unread count
        const totalUnread = convList.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);

        console.log(`=== RESULTS: Processed: ${processedCount}, Skipped: ${skippedCount}, Final: ${convList.length}, Total Unread: ${totalUnread} ===`);
        if (convList.length === 0) {
          console.warn("⚠️ NO CONVERSATIONS FOUND!");
          console.warn("==== TROUBLESHOOTING ====");
          console.warn("Total messages from API:", response.data.length);
          console.warn("Your userId:", userId);
          if (response.data.length > 0) {
            console.warn("First message details:", {
              id: response.data[0]._id,
              senderId: typeof response.data[0].senderId === 'object' ? response.data[0].senderId._id : response.data[0].senderId,
              recipientId: typeof response.data[0].recipientId === 'object' ? response.data[0].recipientId._id : response.data[0].recipientId,
              yourUserIdMatches: function() {
                const msg = response.data[0];
                const sId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                const rId = typeof msg.recipientId === 'object' ? msg.recipientId._id : msg.recipientId;
                return String(sId) === String(userId) || String(rId) === String(userId);
              }()
            });
          }
        }
        console.table(convList);
        setConversations(convList);
      } catch (error) {
        console.error("❌ Error fetching conversations:", error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 3000); // Poll every 3s to reduce lag
    
    // Listen for notification mark-read events
    const handleNotificationRead = () => {
      fetchConversations(); // Refresh immediately when notification is marked read
    };
    window.addEventListener("notification-marked-read", handleNotificationRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("notification-marked-read", handleNotificationRead);
    };
  }, [showChat, token, apiUrl, userId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !token) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/messages?otherId=${selectedConversation.userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Messages API response:", response.data);
        console.log("Looking for otherId:", selectedConversation.userId);

        // Get ALL messages where we're in conversation with this specific user
        // Either we sent to them OR they sent to us
        const messagesWithUser = response.data.filter((msg) => {
          // Handle both string IDs and populated objects
          const senderIdValue = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
          const recipientIdValue = typeof msg.recipientId === 'object' ? msg.recipientId._id : msg.recipientId;
          
          const isFromThem = String(senderIdValue) === String(selectedConversation.userId) && 
                            String(recipientIdValue) === String(userId);
          const isToThem = String(senderIdValue) === String(userId) && 
                          String(recipientIdValue) === String(selectedConversation.userId);
          
          console.log("Message:", msg, "isFromThem:", isFromThem, "isToThem:", isToThem);
          
          return isFromThem || isToThem;
        });

        // Sort messages by creation date (oldest first)
        const sortedMessages = messagesWithUser.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );

        console.log("Filtered and sorted messages with", selectedConversation.name, ":", sortedMessages);
        setMessages(sortedMessages);

        // Mark messages as read that we received from this user
        messagesWithUser
          .filter((msg) => {
            const recipientIdValue = typeof msg.recipientId === 'object' ? msg.recipientId._id : msg.recipientId;
            const senderIdValue = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
            return String(recipientIdValue) === String(userId) && 
                   String(senderIdValue) === String(selectedConversation.userId) && 
                   !msg.isRead;
          })
          .forEach((msg) => {
            axios.put(
              `${apiUrl}/api/messages/${msg._id}/read`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            ).catch(err => console.error("Error marking as read:", err));
          });
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s to reduce lag
    
    // Listen for notification mark-read events to refresh messages immediately
    const handleNotificationRead = () => {
      fetchMessages(); // Refresh immediately when notification is marked read
    };
    window.addEventListener("notification-marked-read", handleNotificationRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("notification-marked-read", handleNotificationRead);
    };
  }, [selectedConversation, token, apiUrl, userId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When conversations load, check if we need to select one from notification
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const targetUserId = localStorage.getItem("openChatWithUserId");
      if (targetUserId) {
        const targetConv = conversations.find(
          (conv) => String(conv.userId) === String(targetUserId)
        );
        if (targetConv) {
          console.log("✅ Found target conversation, selecting:", targetConv);
          setSelectedConversation(targetConv);
          localStorage.removeItem("openChatWithUserId");
          localStorage.removeItem("openChatWithUserName");
        }
      }
    }
  }, [conversations, selectedConversation]);

  // Listen for notification click to open chat with specific user
  useEffect(() => {
    const handleOpenChatWithUser = () => {
      const userId = localStorage.getItem("openChatWithUserId");
      const userName = localStorage.getItem("openChatWithUserName");
      
      if (userId && userName) {
        console.log("🎯 Opening chat with user:", userId, userName);
        // Open chat modal
        setShowChat(true);
        
        // Try to find and select the conversation from existing conversations
        const targetConv = conversations.find(
          (conv) => String(conv.userId) === String(userId)
        );
        if (targetConv) {
          console.log("✅ Found target conversation immediately");
          setSelectedConversation(targetConv);
          localStorage.removeItem("openChatWithUserId");
          localStorage.removeItem("openChatWithUserName");
        } else {
          console.log("⏳ Target conversation not yet loaded, will select when available");
          // Leave in localStorage, will be picked up by the useEffect above
        }
      }
    };

    window.addEventListener("open-chat-with-user", handleOpenChatWithUser);
    return () => window.removeEventListener("open-chat-with-user", handleOpenChatWithUser);
  }, [conversations]);

  // Handle dragging the floating button with boundary checking
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Keep button within screen bounds (60px = button size)
      const buttonSize = 60;
      const minX = 0;
      const maxX = window.innerWidth - buttonSize;
      const minY = 0;
      const maxY = window.innerHeight - buttonSize;

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const response = await axios.post(
        `${apiUrl}/api/messages/send`,
        {
          recipientId: selectedConversation.userId,
          content: messageText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add new message and sort by timestamp
      const newMessages = [...messages, response.data.data || response.data];
      const sortedMessages = newMessages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setMessages(sortedMessages);
      setMessageText("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggleChat = (e) => {
    if (isDragging) return; // Don't toggle if dragging
    setShowChat(!showChat);
  };

  return (
    <>
      {/* Floating Chat Button - Draggable */}
      <button
        ref={buttonRef}
        className="floating-chat-btn"
        onClick={handleToggleChat}
        onMouseDown={handleMouseDown}
        title="Open Messages (click to toggle, drag to move)"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <span className="chat-bubble-icon">💬</span>
        {unreadCount > 0 && (
          <span className="chat-badge" title={`${unreadCount} unread`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Modal - Two Column Layout */}
      {showChat && (
        <div className="floating-chat-overlay">
          <div
            className="floating-chat-modal"
            onClick={(e) => {
              console.log("✓ MAIN MODAL CLICKED");
              e.stopPropagation();
            }}
          >
            {/* Left Column - Conversations List */}
            <div className="chat-conversations-panel">
              <div className="chat-header-left">
                <h3>💬 Messages</h3>
                <button
                  className="close-chat-btn"
                  onClick={() => setShowChat(false)}
                  title="Close Messages"
                >
                  ✕
                </button>
              </div>

              <div className="chat-search">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="conversations-list">
                {loading ? (
                  <div className="loading-state">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="empty-state">
                    <span>📭</span>
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.userId}
                      className={`conversation-item ${
                        selectedConversation?.userId === conv.userId
                          ? "active"
                          : ""
                      } ${conv.unreadCount > 0 ? "unread" : ""}`}
                      onClick={() => handleConversationClick(conv)}
                    >
                      <div className="conv-avatar">
                        {conv.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="conv-content">
                        <div className="conv-name">{conv.name}</div>
                        <div className="conv-preview">
                          {conv.lastMessage.substring(0, 40)}
                          {conv.lastMessage.length > 40 ? "..." : ""}
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="unread-badge" title={`${conv.unreadCount} unread`}>
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Chat Window */}
            <div className="chat-messages-panel">
              {!selectedConversation ? (
                <div className="chat-empty-state">
                  <div className="empty-illustration">💬</div>
                  <h4>Select a conversation</h4>
                  <p>Choose a person from the list to start chatting</p>
                </div>
              ) : (
                <>
                  <div className="chat-header-right">
                    <div className="contact-info">
                      <div className="contact-avatar">
                        {selectedConversation.name.charAt(0).toUpperCase()}
                      </div>
                      <h3>{selectedConversation.name}</h3>
                    </div>
                    <button
                      className="close-chat-btn"
                      onClick={() => {
                        setSelectedConversation(null);
                        setMessages([]);
                      }}
                      title="Back"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="messages-container">
                    {messages.length === 0 ? (
                      <div className="empty-state">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const senderIdValue = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                        const isOwnMessage = String(senderIdValue) === String(userId);
                        const readStatus = msg.isRead ? "✓✓" : "✓"; // Double check if read, single if sent
                        
                        return (
                          <div
                            key={msg._id}
                            className={`message-bubble ${isOwnMessage ? "own" : "other"}`}
                            onMouseEnter={() => setShowMessageInfo(msg._id)}
                            onMouseLeave={() => setShowMessageInfo(null)}
                          >
                            <p>{msg.content}</p>
                            <div className="message-footer">
                              <span className="msg-time">
                                {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                              {isOwnMessage && (
                                <>
                                  <span className={`read-receipt ${msg.isRead ? 'read' : 'sent'}`} title={msg.isRead ? "Read" : "Sent"}>
                                    {readStatus}
                                  </span>
                                  {showMessageInfo === msg._id && (
                                    <button 
                                      type="button"
                                      className="msg-info-btn" 
                                      onClick={() => setMessageInfoModal(msg)}
                                      title="Message Info"
                                    >
                                      ℹ️
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="message-input"
                    />
                    <button type="submit" className="send-btn" title="Send">
                      ➤
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Message Info Modal */}
          {messageInfoModal && (
            <div className="message-info-modal-overlay">
              <div 
                className="message-info-modal"
                onClick={(e) => {
                  console.log("✓ INFO MODAL CLICKED");
                  e.stopPropagation();
                }}
              >
                <div className="modal-header">
                  <h4>Message Info</h4>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setMessageInfoModal(null);
                    }}
                    onClick={(e) => {
                      console.log("✓ CLOSE BUTTON CLICKED");
                      e.stopPropagation();
                      setMessageInfoModal(null);
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-content">
                  <div className="info-item">
                    <label>Sent:</label>
                    <span>{new Date(messageInfoModal.createdAt).toLocaleString()}</span>
                  </div>
                  {messageInfoModal.isRead && messageInfoModal.readAt && (
                    <div className="info-item">
                      <label>Read:</label>
                      <span>{new Date(messageInfoModal.readAt).toLocaleString()}</span>
                    </div>
                  )}
                  {!messageInfoModal.isRead && (
                    <div className="info-item">
                      <label>Status:</label>
                      <span>Sent (not read yet)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChatModal;
