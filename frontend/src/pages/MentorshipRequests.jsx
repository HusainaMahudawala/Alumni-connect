import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ApprovalModal from "../components/ApprovalModal";
import "./MentorshipRequests.css";

function MentorshipRequests() {
  const navigate = useNavigate();
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const token = localStorage.getItem("token");

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/requests",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setNotification({ type: "error", text: "Failed to load mentorship requests" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    // Open modal to collect meeting details
    const request = requests.find(r => r._id === id);
    if (request) {
      // Transform request to notification format for ApprovalModal
      setSelectedRequest({
        _id: `notif_${id}`,
        data: { mentorshipId: id },
        message: `Approve mentorship request from ${request.student?.name || 'Student'}`
      });
      setShowApprovalModal(true);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/mentorship/update/${id}`,
        { status: "rejected" },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotification({ type: "success", text: "Mentorship request rejected" });
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      setNotification({ type: "error", text: "Failed to reject request" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const displayName = storedUser?.name || "Alumni";
  const displayEmail = storedUser?.email || "alumni@portal.com";

  const pendingRequests = requests.filter(req => req.status === "pending");
  const processedRequests = requests.filter(req => req.status !== "pending");

  return (
    <div className="mr-wrapper">
      <header className="mr-topbar">
        <div className="topbar-brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-copy">
            <p className="brand-main">AlumniConnect</p>
            <p className="brand-sub">Alumni Portal</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="topbar-notification" type="button" aria-label="Notifications">
            🔔
          </button>
        </div>
      </header>

      <div className="mr-shell">
        <aside className="mr-sidebar">
          <div className="sidebar-menu-wrap">
            <p className="sidebar-menu-title">Menu</p>
            <nav className="sidebar-menu-list">
              <button
                type="button"
                onClick={() => navigate("/alumni-dashboard")}
                className={`sidebar-menu-item ${location.pathname === "/alumni-dashboard" ? "active" : ""}`}
              >
                <span>📊</span>
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/alumni-directory")}
                className="sidebar-menu-item"
              >
                <span>👥</span>
                Alumni Directory
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-opportunities")}
                className={`sidebar-menu-item ${location.pathname === "/my-opportunities" ? "active" : ""}`}
              >
                <span>💼</span>
                Jobs Board
              </button>
              <button
                type="button"
                onClick={() => navigate("/alumni-profile/edit")}
                className="sidebar-menu-item"
              >
                <span>✍</span>
                Edit Profile
              </button>
              <button type="button" className="sidebar-menu-item muted">
                <span>🗣</span>
                Community Feed
              </button>
              <button type="button" className="sidebar-menu-item muted">
                <span>📅</span>
                Events
              </button>
              <button
                type="button"
                onClick={() => navigate("/mentorship-requests")}
                className={`sidebar-menu-item ${location.pathname === "/mentorship-requests" ? "active" : ""}`}
              >
                <span>🤝</span>
                Mentorship
              </button>
            </nav>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div>
              <p className="profile-name">{displayName}</p>
              <p className="profile-role">Alumni Member</p>
              <p className="profile-email">{displayEmail}</p>
            </div>
          </div>

          <button className="sidebar-logout" type="button" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main className="mr-main">
          <div className="mr-container">
            <div className="mr-header">
              <h1>Mentorship Requests</h1>
              <p>Review and manage student mentorship applications</p>
            </div>

            {loading ? (
              <div className="loading-state">
                <p>Loading requests...</p>
              </div>
            ) : (
              <div className="sections-row">
                {/* Pending Requests */}
                <section className="requests-section">
                  <div className="section-title-bar">
                    <h2>Pending Requests</h2>
                    <span className="count-badge">{pendingRequests.length}</span>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📬</div>
                      <h3>No Pending Requests</h3>
                      <p>You don't have any pending mentorship requests at the moment</p>
                    </div>
                  ) : (
                    <div className="requests-grid">
                      {pendingRequests.map(req => (
                        <article key={req._id} className="request-card">
                          <div className="request-header">
                            <div className="student-avatar">
                              {req.student?.name?.charAt(0).toUpperCase() || "S"}
                            </div>
                            <div className="student-info">
                              <h3>{req.student?.name || "Unknown Student"}</h3>
                              <p className="student-email">{req.student?.email || "No email"}</p>
                              {req.student?.phone && (
                                <p className="student-phone">📞 {req.student.phone}</p>
                              )}
                            </div>
                            <span className="status-badge pending">Pending</span>
                          </div>

                          {req.purpose && (
                            <div className="request-message">
                              <p className="message-label">Purpose:</p>
                              <p className="message-text">{req.purpose}</p>
                            </div>
                          )}

                          <div className="request-actions">
                            <button 
                              className="btn-approve" 
                              onClick={() => handleApprove(req._id)}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="btn-reject" 
                              onClick={() => handleReject(req._id)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {/* Processed Requests */}
                <section className="requests-section">
                  <div className="section-title-bar">
                    <h2>Recent History</h2>
                    <span className="count-badge secondary">{processedRequests.length}</span>
                  </div>

                  {processedRequests.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <h3>No History Yet</h3>
                      <p>Approved or rejected requests will appear here</p>
                    </div>
                  ) : (
                    <div className="requests-grid">
                      {processedRequests.map(req => (
                        <article key={req._id} className="request-card processed">
                          <div className="request-header">
                            <div className="student-avatar">
                              {req.student?.name?.charAt(0).toUpperCase() || "S"}
                            </div>
                            <div className="student-info">
                              <h3>{req.student?.name || "Unknown Student"}</h3>
                              <p className="student-email">{req.student?.email || "No email"}</p>
                            </div>
                            <span className={`status-badge ${req.status}`}>
                              {req.status === "approved" ? "✓ Approved" : "✕ Rejected"}
                            </span>
                          </div>

                          {req.purpose && (
                            <div className="request-message">
                              <p className="message-text">{req.purpose}</p>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.text}
          <button 
            className="close-notification" 
            onClick={() => setNotification(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <ApprovalModal
          notification={selectedRequest}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRequest(null);
          }}
          onApproveSuccess={() => {
            setShowApprovalModal(false);
            setSelectedRequest(null);
            setNotification({ type: "success", text: "Mentorship request approved!" });
            fetchRequests();
          }}
          onNotificationResolved={() => {
            // Notification deleted
          }}
        />
      )}
    </div>
  );
}

export default MentorshipRequests;