import React, { useEffect, useState } from "react";
import StudentStatsGraph from "../components/StudentStatsGraph";
import NotificationBell from "../components/NotificationBell";
import ApprovalModal from "../components/ApprovalModal";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch applied opportunities whenever dashboard is loaded or navigated to
  useEffect(() => {
    const fetchAppliedOpportunities = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/opportunity/applied", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInternshipList(res.data);
      } catch {
        setInternshipList([]);
      }
    };
    if (location.pathname === "/student") {
      fetchAppliedOpportunities();
    }
  }, [location.pathname]);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [savedJobsModal, setSavedJobsModal] = useState(false);
  const [savedJobsList, setSavedJobsList] = useState([]);
  const [activityModal, setActivityModal] = useState(false);
  const [pendingModal, setPendingModal] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [approvedModal, setApprovedModal] = useState(false);
  const [approvedList, setApprovedList] = useState([]);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const [internshipModal, setInternshipModal] = useState(false);
  const [internshipList, setInternshipList] = useState([]);
  const [internshipLoading, setInternshipLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const openPendingModal = async () => {
    setPendingModal(true);
    setPendingLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/mentorship/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingList(res.data.filter((m) => m.status === "pending"));
    } catch {
      setPendingList([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const openApprovedModal = async () => {
    setApprovedModal(true);
    setApprovedLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/mentorship/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApprovedList(res.data.filter((m) => m.status === "approved"));
    } catch {
      setApprovedList([]);
    } finally {
      setApprovedLoading(false);
    }
  };

  const openInternshipModal = async () => {
    setInternshipModal(true);
    setInternshipLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/opportunity/applied", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInternshipList(res.data);
    } catch {
      try {
        const token = localStorage.getItem("token");
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        const currentUserId = payload?.id;

        const fallbackRes = await axios.get("http://localhost:5000/api/opportunity", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const applied = (fallbackRes.data || []).filter((opp) =>
          (opp.applicants || []).some((a) => {
            if (!a) return false;
            if (typeof a === "string") return a === currentUserId;
            if (a.toString) return a.toString() === currentUserId;
            if (a._id) return String(a._id) === currentUserId;
            return false;
          })
        );

        setInternshipList(applied);
      } catch {
        setInternshipList([]);
      }
    } finally {
      setInternshipLoading(false);
    }
  };

  const openSavedJobsModal = () => {
    try {
      const savedJobs = JSON.parse(localStorage.getItem("savedJobs") || "[]");
      setSavedJobsList(Array.isArray(savedJobs) ? savedJobs : []);
    } catch {
      setSavedJobsList([]);
    }
    setSavedJobsModal(true);
  };

  useEffect(() => {
    const syncSavedJobsCount = () => {
      try {
        const savedJobs = JSON.parse(localStorage.getItem("savedJobs") || "[]");
        setSavedJobsCount(Array.isArray(savedJobs) ? savedJobs.length : 0);
      } catch {
        setSavedJobsCount(0);
      }
    };

    syncSavedJobsCount();
    window.addEventListener("storage", syncSavedJobsCount);
    window.addEventListener("focus", syncSavedJobsCount);

    return () => {
      window.removeEventListener("storage", syncSavedJobsCount);
      window.removeEventListener("focus", syncSavedJobsCount);
    };
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/dashboard/student",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStudentData(res.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
        navigate("/");
      }
    };

    fetchDashboard();
  }, [navigate]);

  // Activities based on backend data
  // Count each job type from internshipList
  const internshipCount = internshipList.filter(opp => opp.type === "internship").length;
  const fullTimeCount = internshipList.filter(opp => opp.type === "full-time").length;
  const partTimeCount = internshipList.filter(opp => opp.type === "part-time").length;
  const hackathonCount = internshipList.filter(opp => opp.type === "hackathon").length;
  const contractCount = internshipList.filter(opp => opp.type === "contract").length;
  const jobCount = internshipList.filter(opp => opp.type === "job").length;


  // Build the applied string with proper comma and 'and' handling
  const appliedTypes = [];
  if (internshipCount) appliedTypes.push(`${internshipCount} internship${internshipCount > 1 ? 's' : ''}`);
  if (jobCount) appliedTypes.push(`${jobCount} job${jobCount > 1 ? 's' : ''}`);
  if (fullTimeCount) appliedTypes.push(`${fullTimeCount} full-time job${fullTimeCount > 1 ? 's' : ''}`);
  if (partTimeCount) appliedTypes.push(`${partTimeCount} part-time job${partTimeCount > 1 ? 's' : ''}`);
  if (hackathonCount) appliedTypes.push(`${hackathonCount} hackathon${hackathonCount > 1 ? 's' : ''}`);
  if (contractCount) appliedTypes.push(`${contractCount} contract job${contractCount > 1 ? 's' : ''}`);

  let appliedString = 'You have not applied to any opportunities';
  if (appliedTypes.length === 1) {
    appliedString = `You have applied to ${appliedTypes[0]}`;
  } else if (appliedTypes.length > 1) {
    appliedString = `You have applied to ${appliedTypes.slice(0, -1).join(', ')} and ${appliedTypes[appliedTypes.length - 1]}`;
  }

  const recentActivities = studentData ? [
    {
      id: 1,
      type: "opportunity",
      title: appliedString,
      time: "Today",
      icon: "💼"
    },
    {
      id: 2,
      type: "mentorship",
      title: `${studentData.pendingMentorships || 0} mentorship requests pending`,
      time: "This week",
      icon: "🤝"
    },
    {
      id: 3,
      type: "mentorship",
      title: `${studentData.approvedMentorships || 0} mentorships approved`,
      time: "This month",
      icon: "👥"
    }
  ] : [];

  return (
    <div className="dashboard">
      {/* Top Navigation */}
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="logo-icon">🎓</span>
            <div className="logo-text">
              <div className="logo-main">AlumniConnect</div>
              <div className="logo-sub">Student Portal</div>
            </div>
          </div>
        </div>
        <div className="navbar-right">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <NotificationBell
            onApproveClick={(notification) => {
              setSelectedNotification(notification);
              setShowApprovalModal(true);
            }}
          />
        </div>
      </nav>

      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-content">
            <div className="menu-section">
              <h4 className="menu-title">MAIN MENU</h4>
              <nav className="menu-list">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("/student");
                  }}
                  className={`menu-item ${location.pathname === "/student" ? "active" : ""}`}
                >
                  <span className="menu-icon">📊</span>
                  <span>Dashboard</span>
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("/opportunity");
                  }}
                  className={`menu-item ${location.pathname === "/opportunity" ? "active" : ""}`}
                >
                  <span className="menu-icon">💼</span>
                  <span>Opportunities</span>
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("/mentorship");
                  }}
                  className={`menu-item ${location.pathname === "/mentorship" ? "active" : ""}`}
                >
                  <span className="menu-icon">🤝</span>
                  <span>Mentorship</span>
                </a>
                <a href="#" className="menu-item">
                  <span className="menu-icon">📅</span>
                  <span>Events</span>
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("/community");
                  }}
                  className={`menu-item ${location.pathname === "/community" ? "active" : ""}`}
                >
                  <span className="menu-icon">💬</span>
                  <span>Community Feed</span>
                </a>
              </nav>
            </div>
          </div>

          {/* User Profile at bottom */}
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                {studentData?.name?.charAt(0).toUpperCase() || "S"}
              </div>
              <div className="user-info">
                <p className="user-name">{studentData?.name || "Student"}</p>
                <p className="user-role">Student Account</p>
              </div>
              <button className="user-menu-btn">⋮</button>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <section className="dashboard-content">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-left">
              <h1 className="page-title">Welcome back, {studentData?.name || "Student"}! 👋</h1>
              <p className="header-subtitle">Here's what's happening with your account today.</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="dashboard-section">
            <div className="stats-grid">
              <div className="stat-card" onClick={openSavedJobsModal}>
                <div className="stat-header">
                  <h3>Saved Jobs</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#dbeafe" }}>🔖</span>
                </div>
                <p className="stat-number">{savedJobsCount}</p>
                <p className="stat-detail">Bookmarked opportunities</p>
                <span className="stat-link">View all →</span>
              </div>

              <div className="stat-card" onClick={openPendingModal}>
                <div className="stat-header">
                  <h3>Pending Mentorships</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#dcfce7" }}>⏳</span>
                </div>
                <p className="stat-number">{studentData?.pendingMentorships ?? 0}</p>
                <p className="stat-detail">Awaiting response</p>
                <span className="stat-link">View all →</span>
              </div>

              <div className="stat-card" onClick={openApprovedModal}>
                <div className="stat-header">
                  <h3>Approved Mentorships</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#f3e8ff" }}>✅</span>
                </div>
                <p className="stat-number">{studentData?.approvedMentorships ?? 0}</p>
                <p className="stat-detail">Active mentors</p>
                <span className="stat-link">View all →</span>
              </div>

              <div className="stat-card" onClick={openInternshipModal}>
                <div className="stat-header">
                    <h3>Applications</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#fef3c7" }}>💼</span>
                </div>
                <p className="stat-number">{studentData?.appliedOpportunities ?? 0}</p>
                <p className="stat-detail">Applied opportunities</p>
                <span className="stat-link">View all →</span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Recent Activities & Quick Stats */}
          <div className="bottom-section">
            {/* Recent Activities */}
            <div className="recent-activities">
              <div className="section-header">
                <h2 className="section-title">Recent Activities</h2>
                <button className="view-all-link" onClick={() => setActivityModal(true)}>View All</button>
              </div>

              <div className="activities-list">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="activity-item"
                    onClick={() => handleNavigation(activity.type === "opportunity" ? "/opportunity" : "/mentorship")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Stats Graph */}
            <div className="quick-stats">
              <h2 className="section-title">Student Stats</h2>
              <StudentStatsGraph />
            </div>
          </div>
        </section>
      </div>

      {/* ── Recent Activities Modal ── */}
      {activityModal && (
        <div className="sd-modal-backdrop" onClick={() => setActivityModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>📌 Recent Activities</h3>
              <button className="sd-modal-close" onClick={() => setActivityModal(false)}>✕</button>
            </div>
            <div className="sd-modal-body">
              {recentActivities.length === 0 && (
                <div className="sd-modal-empty">
                  <span>📌</span>
                  <p>No activities yet.</p>
                </div>
              )}
              {recentActivities.map((activity) => (
                <div key={activity.id} className="sd-activity-row">
                  <div className="sd-activity-icon">{activity.icon}</div>
                  <div className="sd-activity-info">
                    <p className="sd-activity-title">{activity.title}</p>
                    <p className="sd-activity-time">{activity.time}</p>
                  </div>
                  <button
                    className="sd-activity-open"
                    onClick={() => {
                      setActivityModal(false);
                      handleNavigation(activity.type === "opportunity" ? "/opportunity" : "/mentorship");
                    }}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
            <div className="sd-modal-footer">
              <button className="sd-modal-btn" onClick={() => setActivityModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved Jobs Modal ── */}
      {savedJobsModal && (
        <div className="sd-modal-backdrop" onClick={() => setSavedJobsModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>🔖 Saved Jobs</h3>
              <button className="sd-modal-close" onClick={() => setSavedJobsModal(false)}>✕</button>
            </div>
            <div className="sd-modal-body">
              {savedJobsList.length === 0 && (
                <div className="sd-modal-empty">
                  <span>🔖</span>
                  <p>No saved jobs yet.</p>
                </div>
              )}
              {savedJobsList.map((opp) => (
                <div key={opp._id} className="sd-opp-row">
                  <div className="sd-opp-icon">🔖</div>
                  <div className="sd-opp-info">
                    <p className="sd-opp-title">{opp.title}</p>
                    <p className="sd-opp-company">{opp.company}{opp.location ? ` · ${opp.location}` : ""}</p>
                    <p className="sd-opp-meta">
                      {opp.type && <span className="sd-opp-tag">{opp.type}</span>}
                      {opp.workMode && <span className="sd-opp-tag">{opp.workMode}</span>}
                      {opp.salaryStipend && <span className="sd-opp-tag">💰 {opp.salaryStipend}</span>}
                    </p>
                  </div>
                  <span className="sd-mentorship-badge saved">Saved</span>
                </div>
              ))}
            </div>
            <div className="sd-modal-footer">
              <button className="sd-modal-btn" onClick={() => { setSavedJobsModal(false); handleNavigation("/opportunity"); }}>
                Browse Opportunities
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approved Mentorships Modal ── */}
      {approvedModal && (
        <div className="sd-modal-backdrop" onClick={() => setApprovedModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>✅ Approved Mentorships</h3>
              <button className="sd-modal-close" onClick={() => setApprovedModal(false)}>✕</button>
            </div>
            <div className="sd-modal-body">
              {approvedLoading && <p className="sd-modal-state">Loading...</p>}
              {!approvedLoading && approvedList.length === 0 && (
                <div className="sd-modal-empty">
                  <span>✅</span>
                  <p>No approved mentorships yet.</p>
                </div>
              )}
              {!approvedLoading && approvedList.map((m) => (
                <div key={m._id} className="sd-mentorship-row">
                  <div className="sd-mentorship-avatar">
                    {m.alumni?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="sd-mentorship-info">
                    <p className="sd-mentorship-name">{m.alumni?.name || "Alumni"}</p>
                    <p className="sd-mentorship-email">{m.alumni?.email || ""}</p>
                    {m.purpose && <p className="sd-mentorship-purpose">"{m.purpose}"</p>}
                  </div>
                  <span className="sd-mentorship-badge approved">Approved</span>
                </div>
              ))}
            </div>
            <div className="sd-modal-footer">
              <button className="sd-modal-btn" onClick={() => { setApprovedModal(false); handleNavigation("/mentorship"); }}>
                Go to Mentorship Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Internship Applications Modal ── */}
      {internshipModal && (
        <div className="sd-modal-backdrop" onClick={() => setInternshipModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>💼 My Internship Applications</h3>
              <button className="sd-modal-close" onClick={() => setInternshipModal(false)}>✕</button>
            </div>
            <div className="sd-modal-body">
              {internshipLoading && <p className="sd-modal-state">Loading...</p>}
              {!internshipLoading && internshipList.length === 0 && (
                <div className="sd-modal-empty">
                  <span>💼</span>
                  <p>You haven't applied to any opportunities yet.</p>
                </div>
              )}
              {!internshipLoading && internshipList.map((opp) => (
                <div key={opp._id} className="sd-opp-row">
                  <div className="sd-opp-icon">💼</div>
                  <div className="sd-opp-info">
                    <p className="sd-opp-title">{opp.title}</p>
                    <p className="sd-opp-company">{opp.company}{opp.location ? ` · ${opp.location}` : ""}</p>
                    <p className="sd-opp-meta">
                      {opp.type && <span className="sd-opp-tag">{opp.type}</span>}
                      {opp.workMode && <span className="sd-opp-tag">{opp.workMode}</span>}
                      {opp.salaryStipend && <span className="sd-opp-tag">💰 {opp.salaryStipend}</span>}
                    </p>
                  </div>
                  <span className="sd-mentorship-badge applied">Applied</span>
                </div>
              ))}
            </div>
            <div className="sd-modal-footer">
              <button className="sd-modal-btn" onClick={() => { setInternshipModal(false); handleNavigation("/opportunity"); }}>
                Browse Opportunities
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending Mentorships Modal ── */}
      {pendingModal && (
        <div className="sd-modal-backdrop" onClick={() => setPendingModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>⏳ Pending Mentorship Requests</h3>
              <button className="sd-modal-close" onClick={() => setPendingModal(false)}>✕</button>
            </div>
            <div className="sd-modal-body">
              {pendingLoading && <p className="sd-modal-state">Loading...</p>}
              {!pendingLoading && pendingList.length === 0 && (
                <div className="sd-modal-empty">
                  <span>🤝</span>
                  <p>No pending mentorship requests.</p>
                </div>
              )}
              {!pendingLoading && pendingList.map((m) => (
                <div key={m._id} className="sd-mentorship-row">
                  <div className="sd-mentorship-avatar">
                    {m.alumni?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="sd-mentorship-info">
                    <p className="sd-mentorship-name">{m.alumni?.name || "Alumni"}</p>
                    <p className="sd-mentorship-email">{m.alumni?.email || ""}</p>
                    {m.purpose && <p className="sd-mentorship-purpose">"{m.purpose}"</p>}
                  </div>
                  <span className="sd-mentorship-badge pending">Pending</span>
                </div>
              ))}
            </div>
            <div className="sd-modal-footer">
              <button className="sd-modal-btn" onClick={() => { setPendingModal(false); handleNavigation("/mentorship"); }}>
                Go to Mentorship Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedNotification && (
        <ApprovalModal
          notification={selectedNotification}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedNotification(null);
          }}
          onApproveSuccess={() => {
            setShowApprovalModal(false);
            setSelectedNotification(null);
          }}
          onNotificationResolved={(notificationId) => {
            // Notification will be deleted from the bell via API call in ApprovalModal
            // The NotificationBell will auto-refresh in 5 seconds or user can manually refresh
          }}
        />
      )}
    </div>
  );
}

export default StudentDashboard;
