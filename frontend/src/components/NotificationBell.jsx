import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import "../styles/NotificationBell.css";

const NotificationBell = ({ onApproveClick }) => {
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [showAllModal, setShowAllModal] = useState(false);
  const [allCurrentPage, setAllCurrentPage] = useState(1);
  const [allTotalCount, setAllTotalCount] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(1);
  const [loadingAll, setLoadingAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [deletingNotification, setDeletingNotification] = useState(false);
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
        const response = await fetch(`${apiUrl}/api/notifications?page=1&limit=3`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
          setAuthError(true);
          return;
        }

        const data = await response.json();
        if (data.success) {
          setAuthError(false);
          const notifs = (data.notifications || []).slice(0, 3);
          setNotifications(notifs);
          setUnreadCount(data.unreadCount || 0);
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

  const fetchAllNotifications = async ({ page = 1 } = {}) => {
    try {
      setLoadingAll(true);
      const response = await fetch(`${apiUrl}/api/notifications?page=${page}&limit=25`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        setAuthError(true);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAuthError(false);
        const next = data.notifications || [];
        setAllNotifications(next);
        setAllCurrentPage(page);
        setAllTotalCount(data.totalCount || 0);
        setAllTotalPages(data.totalPages || 1);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching all notifications:", error);
    } finally {
      setLoadingAll(false);
    }
  };

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

  const handleMarkAsRead = async (event, notificationId, notificationType) => {
    event?.stopPropagation();

    const targetNotification =
      notifications.find((n) => n._id === notificationId) ||
      allNotifications.find((n) => n._id === notificationId);

    if (!targetNotification || targetNotification.isRead) {
      return;
    }

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
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        setAllNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Dispatch event for message notifications so chat component can refresh
        if (notificationType === "message_received") {
          window.dispatchEvent(new Event("notification-marked-read"));
        }
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation();

    const panelNotification = notifications.find((n) => n._id === notificationId);
    const modalNotification = allNotifications.find((n) => n._id === notificationId);
    const targetNotification = panelNotification || modalNotification;

    setNotificationToDelete(targetNotification || { _id: notificationId, isRead: true });
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete?._id) return;

    setDeletingNotification(true);
    const notificationId = notificationToDelete._id;

    try {
      const response = await fetch(`${apiUrl}/api/notifications`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setAllNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (!notificationToDelete.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotificationToDelete(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      setDeletingNotification(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      mentorship_request: "📚",
      mentorship_approved: "✅",
      mentorship_rejected: "❌",
      mentorship_slots_update: "🗓️",
      job_applied: "💼",
      job_approved: "🎉",
      job_rejected: "⚠️",
      job_deleted: "🗑️",
      connect_request: "🤝",
      collaboration_offer: "🎯",
      message_received: "💬",
      event_unregistered: "🚪"
    };
    return icons[type] || "🔔";
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
      handleMarkAsRead(null, notification._id, notification.type);
    }

    // Handle different notification types
    switch (notification.type) {
      case "mentorship_request":
        // For alumni: Navigate to mentorship requests page (no modal)
        navigate("/mentorship-requests");
        break;

      case "mentorship_approved":
        // Student should go to events page after approval notification.
        navigate("/events");
        break;

      case "mentorship_rejected":
        // Navigate to mentorship page
        navigate("/mentorship");
        break;

      case "mentorship_slots_update":
        // Alumni updates monthly mentorship slots here.
        navigate("/mentorship-requests");
        break;

      case "job_applied":
      case "job_approved":
      case "job_rejected":
      case "job_deleted":
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

      case "event_unregistered":
        // Open chat with the user who unregistered to see their reason message.
        if (notification.data?.fromUserId) {
          localStorage.setItem("openChatWithUserId", notification.data.fromUserId);
          localStorage.setItem("openChatWithUserName", notification.data.fromUserName || "User");
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
            ) : authError ? (
              <div className="empty-state">
                <span>⏱️ Session time mismatch</span>
                <p>Your device date/time changed. Please log in again to view notifications.</p>
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
                  <button
                    className="mark-read-btn"
                    onClick={(e) => handleMarkAsRead(e, notification._id, notification.type)}
                    title={notification.isRead ? "Already read" : "Mark as read"}
                    disabled={notification.isRead}
                  >
                    ✅
                  </button>
                  <button
                    className="delete-notification-btn"
                    onClick={(e) => handleDeleteNotification(e, notification._id)}
                    title="Delete notification"
                  >
                    🚮
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="panel-footer">
            <button
              className="view-all-btn"
              onClick={() => {
                setShowPanel(false);
                setShowAllModal(true);
                fetchAllNotifications({ page: 1 });
              }}
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}

      {showAllModal && createPortal(
        <div className="notification-modal-overlay" onClick={() => setShowAllModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <h3>All Notifications</h3>
              <button className="close-btn" onClick={() => setShowAllModal(false)} title="Close">
                ✕
              </button>
            </div>

            <div className="notification-modal-list">
              {loadingAll && allNotifications.length === 0 ? (
                <div className="empty-state"><span>⏳ Loading...</span></div>
              ) : authError ? (
                <div className="empty-state">
                  <span>⏱️ Session time mismatch</span>
                  <p>Your device date/time changed. Please log in again.</p>
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="empty-state">
                  <span>🔔</span>
                  <p>No notifications found</p>
                </div>
              ) : (
                allNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                    data-type={notification.type}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{formatTime(notification.createdAt)}</span>
                    </div>
                    <button
                      className="mark-read-btn"
                      onClick={(e) => handleMarkAsRead(e, notification._id, notification.type)}
                      title={notification.isRead ? "Already read" : "Mark as read"}
                      disabled={notification.isRead}
                    >
                      ✅
                    </button>
                    <button
                      className="delete-notification-btn"
                      onClick={(e) => handleDeleteNotification(e, notification._id)}
                      title="Delete notification"
                    >
                      🚮
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="notification-modal-footer">
              <div className="modal-pagination">
                <button
                  className="notif-pagination-btn"
                  onClick={() => fetchAllNotifications({ page: Math.max(1, allCurrentPage - 1) })}
                  disabled={loadingAll || allCurrentPage <= 1}
                >
                  ← Previous
                </button>

                <span className="notif-pagination-info">Page {allCurrentPage} of {allTotalPages}</span>

                <button
                  className="notif-pagination-btn"
                  onClick={() => fetchAllNotifications({ page: Math.min(allTotalPages, allCurrentPage + 1) })}
                  disabled={loadingAll || allCurrentPage >= allTotalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {notificationToDelete && createPortal(
        <div className="notification-confirm-overlay" onClick={() => !deletingNotification && setNotificationToDelete(null)}>
          <div className="notification-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-confirm-icon">🗑️</div>
            <h4>Delete Notification?</h4>
            <p>This action cannot be undone.</p>
            <div className="notification-confirm-actions">
              <button
                className="notification-confirm-cancel"
                onClick={() => setNotificationToDelete(null)}
                disabled={deletingNotification}
              >
                Cancel
              </button>
              <button
                className="notification-confirm-delete"
                onClick={confirmDeleteNotification}
                disabled={deletingNotification}
              >
                {deletingNotification ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBell;
