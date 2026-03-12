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
  const [workModeFilter, setWorkModeFilter] = useState("any");
  const [notification, setNotification] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [userData, setUserData] = useState(null);
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedJobs") || "[]");
    } catch { return []; }
  });
  const [savingJob, setSavingJob] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef(null);

  // close dropdown when clicking outside
  React.useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const hasApplied = (opp) =>
    opp.applicants?.some((applicantId) => applicantId === user?._id);

  const isSaved = (jobId) => savedJobs.some((j) => j._id === jobId);

  const confirmSaveJob = (job) => {
    if (isSaved(job._id)) {
      // unsave immediately without prompt
      const updated = savedJobs.filter((j) => j._id !== job._id);
      setSavedJobs(updated);
      localStorage.setItem("savedJobs", JSON.stringify(updated));
      setNotification({ type: "success", text: "Job removed from saved list." });
    } else {
      setSavingJob(job);
    }
  };

  const saveJob = (job) => {
    const updated = [...savedJobs, job];
    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
    setSavingJob(null);
    setNotification({ type: "success", text: `"${job.title}" saved successfully!` });
  };

  const toDisplayLabel = (value) => {
    if (!value) return "Not specified";
    return value
      .toString()
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const filtered = opportunities.filter((opp) => {
    const matchesSearch = !searchTerm || 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = jobType === "all" || opp.type === jobType;
    const matchesWorkMode =
      workModeFilter === "any" || opp.workMode === workModeFilter;
    
    return matchesSearch && matchesType && matchesWorkMode;
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
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </label>
            </button>
            <button className="filter-btn">
              <label>
                Work Mode
                <select
                  className="filter-select"
                  value={workModeFilter}
                  onChange={(e) => setWorkModeFilter(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
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
                  const alreadyApplied = hasApplied(opp);
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
                        <span className="job-meta-item">{toDisplayLabel(opp.type)}</span>
                        <span className="job-meta-item">{toDisplayLabel(opp.workMode)}</span>
                        {opp.salaryStipend && (
                          <span className="job-meta-item">{opp.salaryStipend}</span>
                        )}
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
                <div className="detail-scroll-body">
                {/* Header */}
                <div className="detail-header">
                  <div className="detail-company-icon">
                    {selectedJob.company?.charAt(0)?.toUpperCase() || "J"}
                  </div>
                  <div className="detail-title-section">
                    <h1 className="detail-title">{selectedJob.title}</h1>
                    <p className="detail-company">{selectedJob.company}</p>
                  </div>
                  <div className="detail-actions" ref={menuRef}>
                    <button
                      className={`detail-bookmark-btn ${isSaved(selectedJob._id) ? "saved" : ""}`}
                      onClick={() => confirmSaveJob(selectedJob)}
                      title={isSaved(selectedJob._id) ? "Remove from saved" : "Save this job"}
                    >
                      {isSaved(selectedJob._id) ? "🔖" : "🔖"}
                    </button>
                    <button
                      className={`detail-menu-btn ${menuOpen ? "active" : ""}`}
                      onClick={() => setMenuOpen((prev) => !prev)}
                      title="More options"
                    >
                      ⋮
                    </button>
                    {menuOpen && (
                      <div className="detail-dropdown">
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setMenuOpen(false);
                            setNotification({ type: "success", text: "Job link copied to clipboard!" });
                          }}
                        >
                          <span className="dropdown-icon">🔗</span> Copy job link
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            const subject = encodeURIComponent(`Job Opportunity: ${selectedJob.title} at ${selectedJob.company}`);
                            const body = encodeURIComponent(
                              `Hi,\n\nCheck out this opportunity:\n\nRole: ${selectedJob.title}\nCompany: ${selectedJob.company}\nType: ${selectedJob.type}\nLocation: ${selectedJob.location || "Not specified"}\n\nRegards`
                            );
                            window.open(`mailto:?subject=${subject}&body=${body}`);
                            setMenuOpen(false);
                          }}
                        >
                          <span className="dropdown-icon">📧</span> Share via Email
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            confirmSaveJob(selectedJob);
                            setMenuOpen(false);
                          }}
                        >
                          <span className="dropdown-icon">🔖</span>
                          {isSaved(selectedJob._id) ? "Remove from saved" : "Save this job"}
                        </button>
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-item danger"
                          onClick={() => {
                            setMenuOpen(false);
                            setNotification({ type: "error", text: "Report submitted. We will review this job." });
                          }}
                        >
                          <span className="dropdown-icon">🚩</span> Report this job
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta Information */}
                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">Job Type</span>
                    <span className="meta-value">{toDisplayLabel(selectedJob.type)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Work Mode</span>
                    <span className="meta-value">{toDisplayLabel(selectedJob.workMode)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Salary / Stipend</span>
                    <span className="meta-value">
                      {selectedJob.salaryStipend || "Not specified"}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Applicants</span>
                    <span className="meta-value">{selectedJob.applicants?.length || 0}</span>
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
                  <h3 className="detail-section-title">Overview</h3>
                  <p className="detail-description">
                    {selectedJob.overview || "No overview provided"}
                  </p>
                </div>

                {/* Responsibilities */}
                {selectedJob.responsibilities?.length > 0 && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Responsibilities</h3>
                    <ul className="detail-list">
                      {selectedJob.responsibilities.map((item, index) => (
                        <li key={`responsibility-${index}`} className="detail-list-item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills */}
                {selectedJob.requiredSkills?.length > 0 && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Required Skills</h3>
                    <div className="detail-tags">
                      {selectedJob.requiredSkills.map((skill, index) => (
                        <span key={`required-skill-${index}`} className="detail-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Skills */}
                {selectedJob.preferredSkills?.length > 0 && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Preferred Skills</h3>
                    <div className="detail-tags">
                      {selectedJob.preferredSkills.map((skill, index) => (
                        <span key={`preferred-skill-${index}`} className="detail-tag muted">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                </div>{/* end detail-scroll-body */}

                {/* Footer with Apply Button */}
                <div className="detail-footer">
                  <button
                    className={`detail-apply-btn ${
                      hasApplied(selectedJob) ? "applied" : ""
                    }`}
                    disabled={hasApplied(selectedJob)}
                    onClick={() => {
                      if (!hasApplied(selectedJob)) {
                        setConfirming(selectedJob);
                      }
                    }}
                  >
                    {hasApplied(selectedJob)
                      ? "Applied ✓"
                      : "Apply Now"}
                  </button>
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

      {/* Save Job Confirmation Modal */}
      {savingJob && (
        <div className="modal-overlay" onClick={() => setSavingJob(null)}>
          <div className="confirm-modal save-modal" onClick={(e) => e.stopPropagation()}>
            <div className="save-modal-icon">🔖</div>
            <h2>Save this job?</h2>
            <p>
              Do you want to save <strong>{savingJob.title}</strong> at{" "}
              <strong>{savingJob.company}</strong> to your saved list?
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setSavingJob(null)}>
                Cancel
              </button>
              <button className="confirm-btn save-confirm-btn" onClick={() => saveJob(savingJob)}>
                Yes, Save Job
              </button>
            </div>
          </div>
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