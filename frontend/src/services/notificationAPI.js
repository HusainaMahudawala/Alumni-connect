const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Get notification auth token
const getAuthToken = () => localStorage.getItem("token");

// Notification API Service
const notificationAPI = {
  /**
   * Fetch all notifications for the logged-in user
   */
  fetchNotifications: async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch notifications");
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  /**
   * Create a new notification
   */
  createNotification: async (notificationData) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create notification");
      }

      const data = await response.json();
      return data.notification || null;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/mark-read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notificationId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark as read");
      }

      const data = await response.json();
      return data.notification || null;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications?notificationId=${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete notification");
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },

  /**
   * Get mentorship details from notification data
   */
  getMentorshipFromNotification: (notification) => {
    if (!notification || !notification.data) {
      return null;
    }

    return {
      mentorshipId: notification.data.mentorshipId,
      fromUserName: notification.data.fromUserName,
      meetingLink: notification.data.meetingLink,
      meetingDate: notification.data.meetingDate,
      meetingLocation: notification.data.meetingLocation,
    };
  },

  /**
   * Format notification for display
   */
  formatNotification: (notification) => {
    return {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      timestamp: notification.createdAt,
      isRead: notification.isRead,
      data: notification.data,
    };
  },

  /**
   * Get notification icon based on type
   */
  getNotificationIcon: (type) => {
    const iconMap = {
      mentorship_request: "🤝",
      mentorship_approved: "✅",
      mentorship_rejected: "❌",
      mentorship_slots_update: "🗓️",
      job_applied: "💼",
    };
    return iconMap[type] || "📬";
  },

  /**
   * Get notification title based on type
   */
  getNotificationTitle: (type) => {
    const titleMap = {
      mentorship_request: "Mentorship Request",
      mentorship_approved: "Mentorship Approved",
      mentorship_rejected: "Mentorship Rejected",
      mentorship_slots_update: "Update Mentorship Slots",
      job_applied: "Job Application",
    };
    return titleMap[type] || "Notification";
  },

  /**
   * Filter notifications by type
   */
  filterByType: (notifications, type) => {
    return notifications.filter((notif) => notif.type === type);
  },

  /**
   * Get only unread notifications
   */
  getUnreadNotifications: (notifications) => {
    return notifications.filter((notif) => !notif.isRead);
  },

  /**
   * Sort notifications by timestamp (newest first)
   */
  sortByTimestamp: (notifications) => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },
};

export default notificationAPI;
