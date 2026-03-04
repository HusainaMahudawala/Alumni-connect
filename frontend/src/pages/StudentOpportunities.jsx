import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./StudentOpportunities.css";

function StudentOpportunities() {
  const navigate = useNavigate();
  const location = useLocation();
  const [opportunities, setOpportunities] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState("all");
  const [location_filter, setLocation] = useState("any");
  const [notification, setNotification] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [userData, setUserData] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchOpportunities();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
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
      setUserData(res.data);
    } catch (error) {
      console.log("Error fetching user data:", error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/opportunity",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOpportunities(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const applyOpportunity = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `http://localhost:5000/api/opportunity/apply/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotification({ type: "success", text: res.data.message || "Applied successfully" });
      setConfirming(null);
      fetchOpportunities();
    } catch (error) {
      const msg = error.response?.data?.message;
      setNotification({ type: "error", text: msg || "Something went wrong" });
      setConfirming(null);
    }
  };

  const filtered = opportunities.filter((opp) => {
    const matchesSearch = !searchTerm || 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = jobType === "all" || opp.type === jobType;
    
    return matchesSearch && matchesType;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="opportunities-wrapper">
      {/* Navbar */}
      <nav className="opportunities-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="logo-icon">🎓</span>
            <div className="logo-text">
              <div className="logo-main">AlumniConnect</div>
              <div className="logo-sub">Job Portal</div>
            </div>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="navbar-center">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search roles, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right - Filters */}
        <div className="navbar-right">
          <div className="filter-btn-group">
            <button className="filter-btn">
              <label>
                Job Type
                <select
                  className="filter-select"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </label>
            </button>
            <button className="filter-btn">
              <label>
                Location
                <select
                  className="filter-select"
                  value={location_filter}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                </select>
              </label>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="opportunities-container">
        {/* Sidebar */}
        <aside className="opportunities-sidebar">
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
                  <span>Jobs</span>
                </a>
                <a href="#" className="menu-item">
                  <span className="menu-icon">📚</span>
                  <span>My Courses</span>
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
                <a href="#" className="menu-item">
                  <span className="menu-icon">💬</span>
                  <span>Community Feed</span>
                </a>
              </nav>
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                {userData?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="user-info">
                <p className="user-name">{userData?.name || user?.name || "Student"}</p>
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
        <div className="opportunities-main">
          {/* Job Feed - Left Panel */}
          <div className="job-feed">
            <div className="job-feed-header">
              <h3 className="job-feed-title">Opportunities</h3>
              <span className="job-count">{filtered.length}</span>
            </div>

            <div className="job-list">
              {filtered.length > 0 ? (
                filtered.map((opp) => {
                  const alreadyApplied = opp.applicants?.includes(user?._id);
                  const isSelected = selectedJob?._id === opp._id;

                  return (
                    <div
                      key={opp._id}
                      className={`job-card ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedJob(opp)}
                    >
                      <div className="job-card-header">
                        <div className="job-company-icon">
                          {opp.company?.charAt(0)?.toUpperCase() || "J"}
                        </div>
                        <div className="job-card-title-section">
                          <h4 className="job-title">{opp.title}</h4>
                          <p className="job-company">{opp.company || "Not specified"}</p>
                        </div>
                        {alreadyApplied && <span className="applied-badge">✓</span>}
                      </div>
                      <div className="job-card-meta">
                        <span className="job-meta-item">{opp.type}</span>
                        <span className="job-meta-item">
                          {opp.applicants?.length || 0} applicants
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "#999" }}>
                  No opportunities found
                </div>
              )}
            </div>
          </div>

          {/* Job Detail Panel - Right Panel */}
          <div className="job-detail">
            {selectedJob ? (
              <>
                {/* Header */}
                <div className="detail-header">
                  <div className="detail-company-icon">
                    {selectedJob.company?.charAt(0)?.toUpperCase() || "J"}
                  </div>
                  <div className="detail-title-section">
                    <h1 className="detail-title">{selectedJob.title}</h1>
                    <p className="detail-company">{selectedJob.company}</p>
                  </div>
                  <div className="detail-actions">
                    <button className="detail-bookmark-btn">🔖</button>
                    <button className="detail-menu-btn">⋮</button>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">Job Type</span>
                    <span className="meta-value">{selectedJob.type}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Applicants</span>
                    <span className="meta-value">{selectedJob.applicants?.length || 0}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Deadline</span>
                    <span className="meta-value">
                      {selectedJob.deadline
                        ? new Date(selectedJob.deadline).toLocaleDateString()
                        : "No deadline"}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Location</span>
                    <span className="meta-value">
                      {selectedJob.location || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="detail-section">
                  <h3 className="detail-section-title">Description</h3>
                  <p className="detail-description">
                    {selectedJob.description || "No description provided"}
                  </p>
                </div>

                {/* Requirements */}
                {selectedJob.requirements && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Requirements</h3>
                    <p className="detail-requirements">
                      {selectedJob.requirements}
                    </p>
                  </div>
                )}

                {/* Footer with Apply Button */}
                <div className="detail-footer">
                  <button
                    className={`detail-apply-btn ${
                      selectedJob.applicants?.includes(user?._id) ? "applied" : ""
                    }`}
                    disabled={selectedJob.applicants?.includes(user?._id)}
                    onClick={() => {
                      if (!selectedJob.applicants?.includes(user?._id)) {
                        setConfirming(selectedJob);
                      }
                    }}
                  >
                    {selectedJob.applicants?.includes(user?._id)
                      ? "Applied ✓"
                      : "Apply Now"}
                  </button>
                  <a href="#" className="detail-report-btn">
                    Report this job
                  </a>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
                <p>Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.text}
          <span
            className="close-notif"
            onClick={() => setNotification(null)}
          >
            ×
          </span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Application</h2>
            <p>
              Are you sure you want to apply for <strong>{confirming.title}</strong> at{" "}
              <strong>{confirming.company}</strong>?
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setConfirming(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => applyOpportunity(confirming._id)}
              >
                Yes, Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentOpportunities;