import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./StudentOpportunities.css";

const API_BASE = "http://localhost:5000/api";
const API_HOST = "http://localhost:5000";

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
  const [reportingJob, setReportingJob] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    interests: "",
    skills: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [profileError, setProfileError] = useState("");
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

  const submitReport = async () => {
    if (!reportingJob?._id) return;

    if (!reportReason.trim()) {
      setNotification({ type: "error", text: "Please enter a reason before submitting." });
      return;
    }

    try {
      setReportSubmitting(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `http://localhost:5000/api/opportunity/report/${reportingJob._id}`,
        { reason: reportReason.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotification({ type: "success", text: res.data.message || "Report submitted. Admin will review it." });
      setReportingJob(null);
      setReportReason("");
    } catch (error) {
      setNotification({ type: "error", text: error.response?.data?.message || "Failed to submit report" });
    } finally {
      setReportSubmitting(false);
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

  const jobTypeFilterLabel =
    jobType === "all" ? "Job Type" : `Type: ${toDisplayLabel(jobType)}`;
  const workModeFilterLabel =
    workModeFilter === "any"
      ? "Work Mode"
      : `Mode: ${toDisplayLabel(workModeFilter)}`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const openProfileModal = async () => {
    setProfileModal(true);
    setProfileLoading(true);
    setProfileError("");
    setProfileImageFile(null);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/users/me/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profile = res.data || {};
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        interests: Array.isArray(profile.interests) ? profile.interests.join(", ") : "",
        skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : ""
      });

      if (profile.profilePicture) {
        setProfileImagePreview(
          profile.profilePicture.startsWith("http")
            ? profile.profilePicture
            : `${API_HOST}${profile.profilePicture}`
        );
      } else {
        setProfileImagePreview("");
      }
    } catch (error) {
      setProfileError(error.response?.data?.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfileField = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleProfileImageUpload = async () => {
    if (!profileImageFile) {
      setNotification({ type: "error", text: "Please choose an image first." });
      return;
    }

    setProfileUploading(true);
    setProfileError("");

    try {
      const token = localStorage.getItem("token");
      const body = new FormData();
      body.append("profilePicture", profileImageFile);

      const res = await axios.post(`${API_BASE}/users/me/student/profile-picture`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      const uploadedPath = res.data?.profilePicture || "";
      if (uploadedPath) {
        const finalUrl = uploadedPath.startsWith("http") ? uploadedPath : `${API_HOST}${uploadedPath}`;
        setProfileImagePreview(finalUrl);
        setUserData((prev) => (prev ? { ...prev, profilePicture: uploadedPath } : prev));
      }

      setProfileImageFile(null);
      setNotification({ type: "success", text: "Profile image uploaded." });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to upload image";
      setProfileError(msg);
      setNotification({ type: "error", text: msg });
    } finally {
      setProfileUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/users/me/student`,
        {
          ...profileForm,
          interests: profileForm.interests,
          skills: profileForm.skills
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data?.data) {
        const updated = res.data.data;
        setUserData((prev) => ({ ...(prev || {}), name: updated.name, email: updated.email }));
      }

      setNotification({ type: "success", text: "Profile updated successfully." });
      setProfileModal(false);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update profile";
      setProfileError(msg);
      setNotification({ type: "error", text: msg });
    } finally {
      setProfileSaving(false);
    }
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
                {jobTypeFilterLabel}
                <select
                  className="filter-select"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="contract">Contract</option>
                </select>
              </label>
            </button>
            <button className="filter-btn">
              <label>
                {workModeFilterLabel}
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

          {/* User Profile Footer */}
          <div className="sidebar-footer">
            <div
              className="user-profile student-profile-click"
              role="button"
              tabIndex={0}
              title="Edit Profile"
              onClick={openProfileModal}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProfileModal();
                }
              }}
            >
              <div className="user-avatar">
                {userData?.profilePicture ? (
                  <img
                    src={userData.profilePicture.startsWith("http") ? userData.profilePicture : `${API_HOST}${userData.profilePicture}`}
                    alt="Profile"
                    className="user-avatar-img"
                  />
                ) : (
                  userData?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "S"
                )}
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
                            setReportingJob(selectedJob);
                            setReportReason("");
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

      {profileModal && (
        <div className="sd-modal-backdrop" onClick={() => setProfileModal(false)}>
          <div className="sd-modal sd-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>👤 Edit Profile</h3>
              <button className="sd-modal-close" onClick={() => setProfileModal(false)}>✕</button>
            </div>

            <div className="sd-modal-body">
              {profileLoading && <p className="sd-modal-state">Loading your profile...</p>}

              {!profileLoading && (
                <>
                  <div className="sd-profile-image-block">
                    <div className="sd-profile-image-preview">
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Student profile preview" />
                      ) : (
                        <div className="sd-profile-image-fallback">{(profileForm.name || "S").charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <div className="sd-profile-image-actions">
                      <input type="file" accept="image/*" onChange={handleProfileImageSelect} />
                      <button className="sd-modal-btn" type="button" onClick={handleProfileImageUpload} disabled={profileUploading}>
                        {profileUploading ? "Uploading..." : "Upload Image"}
                      </button>
                    </div>
                  </div>

                  {profileError && <p className="sd-profile-error">{profileError}</p>}

                  <form className="sd-profile-form" onSubmit={saveProfile}>
                    <label htmlFor="opp-profile-name">Name</label>
                    <input
                      id="opp-profile-name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => updateProfileField("name", e.target.value)}
                      required
                    />

                    <label htmlFor="opp-profile-email">Email</label>
                    <input
                      id="opp-profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => updateProfileField("email", e.target.value)}
                      required
                    />

                    <label htmlFor="opp-profile-phone">Phone</label>
                    <input
                      id="opp-profile-phone"
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => updateProfileField("phone", e.target.value)}
                      required
                    />

                    <label htmlFor="opp-profile-interests">Interests (comma separated)</label>
                    <textarea
                      id="opp-profile-interests"
                      rows={2}
                      value={profileForm.interests}
                      onChange={(e) => updateProfileField("interests", e.target.value)}
                      placeholder="AI, Backend, Product"
                    />

                    <label htmlFor="opp-profile-skills">Skills (comma separated)</label>
                    <textarea
                      id="opp-profile-skills"
                      rows={2}
                      value={profileForm.skills}
                      onChange={(e) => updateProfileField("skills", e.target.value)}
                      placeholder="React, Node.js, SQL"
                    />

                    <div className="sd-profile-actions">
                      <button className="sd-profile-cancel" type="button" onClick={() => setProfileModal(false)}>
                        Cancel
                      </button>
                      <button className="sd-modal-btn" type="submit" disabled={profileSaving}>
                        {profileSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
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

      {/* Report Job Modal */}
      {reportingJob && (
        <div className="modal-overlay" onClick={() => { setReportingJob(null); setReportReason(""); }}>
          <div className="confirm-modal report-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Report Opportunity</h2>
            <p>
              Tell us why you are reporting <strong>{reportingJob.title}</strong> at <strong>{reportingJob.company}</strong>.
            </p>
            <textarea
              className="report-reason-input"
              placeholder="Enter reason for report..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <div className="report-char-count">{reportReason.length}/1000</div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setReportingJob(null);
                  setReportReason("");
                }}
                disabled={reportSubmitting}
              >
                Cancel
              </button>
              <button
                className="confirm-btn report-btn"
                onClick={submitReport}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentOpportunities;