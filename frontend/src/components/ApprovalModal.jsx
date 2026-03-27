import React, { useState } from "react";
import "../styles/ApprovalModal.css";

const ApprovalModal = ({ notification, onClose, onApproveSuccess, onNotificationResolved }) => {
  const [formData, setFormData] = useState({
    meetingLink: "",
    meetingDate: "",
    meetingLocation: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.meetingLink.trim()) {
      setError("Meeting link is required");
      return;
    }

    if (!validateUrl(formData.meetingLink)) {
      setError("Invalid meeting link URL");
      return;
    }

    if (!formData.meetingDate) {
      setError("Meeting date is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/api/mentorship/update/${notification.data.mentorshipId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "approved",
            meetingLink: formData.meetingLink,
            meetingDate: new Date(formData.meetingDate).toISOString(),
            meetingLocation: formData.meetingLocation || null
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve mentorship");
      }

      // Delete the mentorship_request notification after approval
      try {
        await fetch(`${apiUrl}/api/notifications`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ notificationId: notification._id })
        });
      } catch (err) {
        console.error("Note: Could not delete notification:", err);
      }

      // Trigger resolved callback and close modal
      if (onNotificationResolved) {
        onNotificationResolved(notification._id);
      }

      onApproveSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Error approving mentorship");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Approve Mentorship Request</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="request-message">{notification?.message}</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="meetingLink">
                Meeting Link <span className="required">*</span>
              </label>
              <input
                type="url"
                id="meetingLink"
                name="meetingLink"
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                value={formData.meetingLink}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meetingDate">
                Date & Time <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="meetingDate"
                name="meetingDate"
                value={formData.meetingDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meetingLocation">
                Location <span className="optional">(Optional)</span>
              </label>
              <input
                type="text"
                id="meetingLocation"
                name="meetingLocation"
                placeholder="e.g., Virtual, Office, Coffee Shop"
                value={formData.meetingLocation}
                onChange={handleChange}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-confirm"
                disabled={loading}
              >
                {loading ? "Approving..." : "Approve & Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
