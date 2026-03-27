import React, { useState, useEffect, useRef } from "react";
import "../styles/NotificationBell.css";

const NotificationBell = ({ onApproveClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Fetch notifications
  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          const unread = (data.notifications || []).filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    // Refresh every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [token, apiUrl]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const handleDelete = async (notificationId) => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
        if (!notifications.find(n => n._id === notificationId).isRead) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications/mark-read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(
          notifications.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleApprove = async (notification) => {
    if (onApproveClick) {
      onApproveClick(notification);
    }
  };

  const handleReject = async (notification) => {
    try {
      const mentorshipId = notification.data.mentorshipId;
      const response = await fetch(
        `${apiUrl}/api/mentorship/${mentorshipId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: "rejected" })
        }
      );
      if (response.ok) {
        await handleDelete(notification._id);
      }
    } catch (error) {
      console.error("Error rejecting mentorship:", error);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getIcon = (type) => {
    switch (type) {
      case "mentorship_request": return "🤝";
      case "mentorship_approved": return "✅";
      case "mentorship_rejected": return "❌";
      case "job_applied": return "💼";
      default: return "📢";
    }
  };

  if (!token) return null;

  return (
    <div className="notification-bell-container">
      <button
        ref={bellRef}
        className="notification-bell"
        onClick={(e) => {
          e.stopPropagation();
          console.log("Bell clicked! Current state:", showNotifications);
          setShowNotifications(!showNotifications);
        }}
        title="Notifications"
        style={{ zIndex: 1002 }}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div 
          ref={dropdownRef} 
          className="notification-dropdown"
          style={{ 
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '10px',
            zIndex: 1001,
            minWidth: '380px',
            maxWidth: '380px'
          }}
        >
          <div className="notification-header">
            <h3>Notifications</h3>
            <button
              className="close-btn"
              onClick={() => setShowNotifications(false)}
            >
              ✕
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">📭</span>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${notif.isRead ? "read" : "unread"}`}
                >
                  <div className="notification-icon">{getIcon(notif.type)}</div>

                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">
                      {formatTime(notif.createdAt)}
                    </span>

                    {notif.type === "mentorship_approved" && notif.data?.meetingDate && (
                      <div className="meeting-info">
                        <p>📅 {new Date(notif.data.meetingDate).toLocaleDateString()}</p>
                        {notif.data?.meetingLink && (
                          <a
                            href={notif.data.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="meeting-link"
                          >
                            Join Meeting →
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="notification-actions">
                    {notif.type === "mentorship_request" && (
                      <>
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(notif)}
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(notif)}
                          title="Reject"
                        >
                          ✕
                        </button>
                        <button
                          className="btn-read"
                          onClick={() => {
                            window.location.href = '/mentorship-requests';
                          }}
                          title="View in Mentorship"
                        >
                          🔗
                        </button>
                      </>
                    )}

                    {!notif.isRead && (
                      <button
                        className="btn-read"
                        onClick={() => handleMarkAsRead(notif._id)}
                        title="Mark as read"
                      >
                        ○
                      </button>
                    )}

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(notif._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
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
