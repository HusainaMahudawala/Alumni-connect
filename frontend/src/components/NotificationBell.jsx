import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NotificationBell.css";

const NotificationBell = ({ onApproveClick }) => {
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Fetch notifications
  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          const notifs = data.notifications || [];
          setNotifications(notifs.slice(0, 10)); // Max 10 notifications
          setUnreadCount(notifs.filter(n => !n.isRead).length);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, apiUrl]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  const handleMarkAsRead = async (notificationId, notificationType) => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications/mark-read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        setNotifications(
          notifications.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
        
        // Dispatch event for message notifications so chat component can refresh
        if (notificationType === "message_received") {
          window.dispatchEvent(new Event("notification-marked-read"));
        }
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      mentorship_request: "📚",
      mentorship_approved: "✅",
      mentorship_rejected: "❌",
      job_applied: "💼",
      connect_request: "🤝",
      collaboration_offer: "🎯",
      message_received: "💬"
    };
    return icons[type] || "🔔";
  };

  // Check if notification has messages that can be marked as read
  const hasMessageContent = (type) => {
    return ["message_received", "collaboration_offer", "connect_request"].includes(type);
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id, notification.type);
    }

    // Handle different notification types
    switch (notification.type) {
      case "mentorship_request":
        // For alumni: Navigate to mentorship requests page (no modal)
        navigate("/mentorship-requests");
        break;

      case "mentorship_approved":
      case "mentorship_rejected":
        // Navigate to mentorship page
        navigate("/mentorship");
        break;

      case "job_applied":
        // Navigate to my opportunities (job management page)
        navigate("/my-opportunities");
        break;

      case "message_received":
        // Open floating chat with sender's conversation selected
        if (notification.data?.fromUserId) {
          // Store sender info for floating chat to pick up
          localStorage.setItem("openChatWithUserId", notification.data.fromUserId);
          localStorage.setItem("openChatWithUserName", notification.data.fromUserName || "User");
          // Dispatch event to notify floating chat
          window.dispatchEvent(new Event("open-chat-with-user"));
        }
        break;

      case "connect_request":
        // Open floating chat with requester
        if (notification.data?.fromUserId) {
          localStorage.setItem("openChatWithUserId", notification.data.fromUserId);
          localStorage.setItem("openChatWithUserName", notification.data.fromUserName || "User");
          window.dispatchEvent(new Event("open-chat-with-user"));
        }
        break;

      case "collaboration_offer":
        // Open floating chat with collaborator
        if (notification.data?.fromUserId) {
          localStorage.setItem("openChatWithUserId", notification.data.fromUserId);
          localStorage.setItem("openChatWithUserName", notification.data.fromUserName || "User");
          window.dispatchEvent(new Event("open-chat-with-user"));
        }
        break;

      default:
        // Use actionUrl if available
        if (notification.data?.actionUrl) {
          navigate(notification.data.actionUrl);
        }
    }

    setShowPanel(false);
  };

  if (!token) return null;

  return (
    <div className="notification-system">
      <button
        ref={bellRef}
        className="notification-bell"
        onClick={() => setShowPanel(!showPanel)}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {showPanel && (
        <div ref={panelRef} className="notification-panel">
          <div className="panel-header">
            <h3>Notifications</h3>
            <button
              className="close-btn"
              onClick={() => setShowPanel(false)}
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="notifications-list">
            {loading ? (
              <div className="empty-state">
                <span>⏳ Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <span>✨ All caught up!</span>
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                  data-type={notification.type}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {(hasMessageContent(notification.type) || !notification.isRead) && (
                    <button
                      className="mark-read-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id, notification.type);
                      }}
                      title="Mark as read"
                    >
                      ✓✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
