import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Mentorship.css";

const API_BASE = "http://localhost:5000/api";
const API_HOST = "http://localhost:5000";

function Mentorship() {
  const navigate = useNavigate();
  const location = useLocation();
  const [alumniList, setAlumniList] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [notification, setNotification] = useState(null); // {type:'success'|'error', text:''}
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // modal for entering purpose
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [purposeInput, setPurposeInput] = useState("");
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

  // Cancel mentorship modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedMentorshipToCancel, setSelectedMentorshipToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // clear notification after a few seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAlumni();
    fetchMyRequests();
    fetchUserData();
  }, []);

  // 🔄 Refresh data when navigating to this page
  useEffect(() => {
    if (location.pathname === "/mentorship") {
      fetchAlumni();
      fetchMyRequests();
    }
  }, [location.pathname]);

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

  const fetchAlumni = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/auth/alumni",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAlumniList(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ FIXED HERE
  const fetchMyRequests = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/my",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMyRequests(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ FIXED HERE
  const requestMentorship = async (alumniId, purpose) => {
    try {
      await axios.post(
        `http://localhost:5000/api/mentorship/apply/${alumniId}`,
        { purpose },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotification({ type: "success", text: "Mentorship request sent!" });
      // Refresh both requests and alumni list to show updated slot counts
      fetchMyRequests();
      fetchAlumni();
    } catch (error) {
      setNotification({
        type: "error",
        text: error.response?.data?.message || "Error occurred"
      });
    }
  };

  const checkStatus = (alumniId) => {
    const found = myRequests.find(
      (req) => req.alumni._id === alumniId && req.status === "pending"
    );
    return found ? found.status : null;
  };

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

  const filteredAlumni = alumniList.filter((alumni) =>
    alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mentorship-wrapper">
      {/* Navbar */}
      <nav className="mentorship-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="logo-icon">🎓</span>
            <div className="logo-text">
              <div className="logo-main">AlumniConnect</div>
              <div className="logo-sub">Mentorship Portal</div>
            </div>
          </div>
        </div>



        <div className="navbar-right">
          <span className="mentor-count-badge">{filteredAlumni.length} Mentors</span>
        </div>
      </nav>

      <div className="mentorship-container">
        {/* Sidebar */}
        <aside className="mentorship-sidebar">
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
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("/events");
                  }}
                  className={`menu-item ${location.pathname === "/events" ? "active" : ""}`}
                >
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
        <div className="mentorship-main">
          <div className="mentorship-header">
            <h2 className="mentorship-title">Connect with Alumni Mentors</h2>
            <p className="mentorship-subtitle">
              Browse experienced professionals and request guidance tailored to your goals.
            </p>
          </div>

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

      {/* purpose entry modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Purpose for mentorship</h3>
            <textarea
              value={purposeInput}
              onChange={(e) => setPurposeInput(e.target.value)}
              placeholder="Describe why you want guidance..."
            />
            <div className="modal-actions">
              <button
                className="mentorship-btn request-btn"
                onClick={() => {
                  if (!purposeInput.trim()) return;
                  requestMentorship(selectedAlumni._id, purposeInput.trim());
                  setPurposeInput("");
                  setModalOpen(false);
                }}
              >
                Send Request
              </button>
              <button
                className="mentorship-btn"
                onClick={() => {
                  setModalOpen(false);
                  setPurposeInput("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
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
                    <label htmlFor="mentor-profile-name">Name</label>
                    <input
                      id="mentor-profile-name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => updateProfileField("name", e.target.value)}
                      required
                    />

                    <label htmlFor="mentor-profile-email">Email</label>
                    <input
                      id="mentor-profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => updateProfileField("email", e.target.value)}
                      required
                    />

                    <label htmlFor="mentor-profile-phone">Phone</label>
                    <input
                      id="mentor-profile-phone"
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => updateProfileField("phone", e.target.value)}
                      required
                    />

                    <label htmlFor="mentor-profile-interests">Interests (comma separated)</label>
                    <textarea
                      id="mentor-profile-interests"
                      rows={2}
                      value={profileForm.interests}
                      onChange={(e) => updateProfileField("interests", e.target.value)}
                      placeholder="AI, Backend, Product"
                    />

                    <label htmlFor="mentor-profile-skills">Skills (comma separated)</label>
                    <textarea
                      id="mentor-profile-skills"
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

          <div className="alumni-grid">
            {filteredAlumni.length > 0 ? (
              filteredAlumni.map((alumni) => {
          const status = checkStatus(alumni._id);
          const companyName = alumni.company?.trim() || "Not specified";
          const yearsOfExperience = Number.isFinite(alumni.experience)
            ? alumni.experience
            : parseInt(alumni.experience, 10) || 0;
          const mentorshipSlots = Number.isFinite(alumni.mentorshipSlots)
            ? alumni.mentorshipSlots
            : parseInt(alumni.mentorshipSlots, 10) || 0;

          return (
            <div key={alumni._id} className="alumni-card">
              <div className="alumni-avatar">
                {alumni.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="alumni-name">{alumni.name}</h3>
              <p className="alumni-email">{alumni.email}</p>
              <div className="alumni-info">
                <span className="info-item">🏢 {companyName}</span>
                <span className="info-item">💼 {yearsOfExperience} yrs</span>
                <span className="info-item">🎯 {mentorshipSlots} slots left</span>
              </div>

              {status ? (
                <button
                  className={`mentorship-btn ${
                    status === "pending"
                      ? "pending-btn"
                      : status === "approved"
                      ? "approved-btn"
                      : "rejected-btn"
                  }`}
                  disabled
                >
                  {status === "pending"
                    ? "Pending"
                    : status === "approved"
                    ? "Approved ✓"
                    : "Rejected"}
                </button>
              ) : (
                <button
                  className="mentorship-btn request-btn"
                  onClick={() => {
                    if (mentorshipSlots <= 0) {
                      setNotification({
                        type: "error",
                        text: "You cannot request mentorship. Slot is not available."
                      });
                      return;
                    }
                    setSelectedAlumni(alumni);
                    setModalOpen(true);
                  }}
                >
                  Request Mentorship
                </button>
              )}
            </div>
          );
              })
            ) : (
              <div className="no-results">
                <p>No mentors found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
  
  
  );
}

export default Mentorship;