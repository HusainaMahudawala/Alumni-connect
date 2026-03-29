
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./Events.css";
import "./StudentDashboard.css";
import "./AlumniDashboard.css";

const API_BASE = "http://localhost:5000/api";
const API_HOST = "http://localhost:5000";

const Events = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileToast, setProfileToast] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    interests: "",
    skills: ""
  });

  // Countdown timer state
  const [countdowns, setCountdowns] = useState({});

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const [liveUser, setLiveUser] = useState(storedUser);

  const userRole = localStorage.getItem("role");
  const isAlumni = userRole === "alumni";
  const portalLabel = isAlumni ? "Alumni Portal" : "Student Portal";
  const profileRoleLabel = isAlumni ? "Alumni Member" : "Student Account";
  const displayName = profileData?.name || liveUser?.name || (isAlumni ? "Alumni" : "Student");
  const displayEmail = profileData?.email || liveUser?.email || "alumni@portal.com";
  const profilePicture = profileData?.profilePicture || liveUser?.profilePicture || "";

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const showProfileToast = (msg, type = "success") => {
    setProfileToast({ msg, type });
    setTimeout(() => setProfileToast(null), 2500);
  };

  const handleProfileCardClick = async () => {
    if (isAlumni) {
      navigate("/alumni-profile/edit");
      return;
    }

    setShowProfileModal(true);
    setProfileError("");
    setProfileImageFile(null);
    setProfileLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setProfileLoading(false);
      return;
    }

    try {
      const endpoint = isAlumni ? `${API_BASE}/alumni/me` : `${API_BASE}/users/me/student`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = isAlumni ? (res.data?.data || null) : (res.data || null);
      if (payload) {
        setProfileData(payload);
        setLiveUser((prev) => ({ ...(prev || {}), ...payload }));
        if (!isAlumni) {
          setProfileForm({
            name: payload.name || "",
            email: payload.email || "",
            phone: payload.phone || "",
            interests: Array.isArray(payload.interests) ? payload.interests.join(", ") : "",
            skills: Array.isArray(payload.skills) ? payload.skills.join(", ") : ""
          });
          if (payload.profilePicture) {
            setProfileImagePreview(
              payload.profilePicture.startsWith("http")
                ? payload.profilePicture
                : `${API_HOST}${payload.profilePicture}`
            );
          } else {
            setProfileImagePreview("");
          }
        }
      }
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const goToEditProfile = () => {
    setShowProfileModal(false);
    if (isAlumni) {
      navigate("/alumni-profile/edit");
      return;
    }
    navigate("/student", { state: { openProfileModal: true } });
  };

  const handleProfileFieldChange = (field, value) => {
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
      showProfileToast("Please choose an image first", "error");
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
        setProfileData((prev) => (prev ? { ...prev, profilePicture: uploadedPath } : prev));

        const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...cachedUser, profilePicture: uploadedPath };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setLiveUser((prev) => ({ ...(prev || {}), profilePicture: uploadedPath }));
      }

      setProfileImageFile(null);
      showProfileToast("Profile image uploaded");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload image";
      setProfileError(msg);
      showProfileToast(msg, "error");
    } finally {
      setProfileUploading(false);
    }
  };

  const handleProfileSave = async (e) => {
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.data) {
        const next = res.data.data;
        setProfileData((prev) => ({
          ...(prev || {}),
          name: next.name,
          email: next.email,
          phone: next.phone,
          interests: next.interests,
          skills: next.skills,
          profilePicture: next.profilePicture || prev?.profilePicture || ""
        }));

        const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...cachedUser,
          name: next.name,
          email: next.email,
          role: next.role,
          profilePicture: next.profilePicture || cachedUser.profilePicture
        };
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
        setLiveUser(updatedUser);
      }

      showProfileToast("Profile updated successfully");
      setShowProfileModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save profile";
      setProfileError(msg);
      showProfileToast(msg, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const renderShell = (content) => (
    <div className={isAlumni ? "alumni-jobs-dashboard" : "events-wrapper"}>
      {isAlumni ? (
        <header className="alumni-topbar">
          <div className="topbar-brand">
            <div className="brand-icon">🎓</div>
            <div className="brand-copy">
              <p className="brand-main">AlumniConnect</p>
              <p className="brand-sub">Alumni Portal</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-search">
              <span className="topbar-search-icon">⌕</span>
              <input type="text" placeholder="Search events..." readOnly />
            </div>
          </div>
        </header>
      ) : (
        <header className="events-navbar">
          <div className="navbar-left">
            <div className="navbar-logo" onClick={() => handleNavigation("/student")} role="button" tabIndex={0}>
              <span className="logo-icon">🎓</span>
              <div className="logo-text">
                <div className="logo-main">AlumniConnect</div>
                <div className="logo-sub">{portalLabel}</div>
              </div>
            </div>
          </div>
          <div className="navbar-right">
            <div className="events-count-badge">{allEvents.length} Events Live</div>
          </div>
        </header>
      )}

      <div className={isAlumni ? "alumni-shell" : "events-layout-container"}>
        {isAlumni ? (
          <aside className="alumni-sidebar">
            <div className="sidebar-menu-wrap">
              <p className="sidebar-menu-title">Menu</p>
              <nav className="sidebar-menu-list">
                <button type="button" onClick={() => handleNavigation("/alumni-dashboard")} className={`sidebar-menu-item ${location.pathname === "/alumni-dashboard" ? "active" : ""}`}><span>📊</span>Dashboard</button>
                <button type="button" onClick={() => handleNavigation("/alumni-directory")} className={`sidebar-menu-item ${location.pathname === "/alumni-directory" ? "active" : ""}`}><span>👥</span>Alumni Directory</button>
                <button type="button" onClick={() => handleNavigation("/my-opportunities")} className={`sidebar-menu-item ${location.pathname === "/my-opportunities" ? "active" : ""}`}><span>💼</span>Jobs Board</button>
                <button type="button" onClick={() => handleNavigation("/community")} className={`sidebar-menu-item ${location.pathname === "/community" ? "active" : ""}`}><span>🗣</span>Community Feed</button>
                <button type="button" onClick={() => handleNavigation("/events")} className={`sidebar-menu-item ${location.pathname === "/events" ? "active" : ""}`}><span>📅</span>Events</button>
                <button type="button" onClick={() => handleNavigation("/mentorship-requests")} className={`sidebar-menu-item ${location.pathname === "/mentorship-requests" ? "active" : ""}`}><span>🤝</span>Mentorship</button>
              </nav>
            </div>

            <div
              className="sidebar-profile"
              role="button"
              tabIndex={0}
              title="Edit Profile"
              onClick={handleProfileCardClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleProfileCardClick();
                }
              }}
            >
              <div className="profile-avatar">
                {profilePicture ? (
                  <img
                    src={profilePicture.startsWith("http") ? profilePicture : `${API_HOST}${profilePicture}`}
                    alt="Profile"
                    className="profile-avatar-img"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="profile-name">{displayName}</p>
                <p className="profile-role">{profileRoleLabel}</p>
                <p className="profile-email">{displayEmail}</p>
              </div>
            </div>

            <button className="sidebar-logout" type="button" onClick={handleLogout}>Logout</button>
          </aside>
        ) : (
          <aside className="events-sidebar">
            <div className="sidebar-content">
              <div className="menu-section">
                <h4 className="menu-title">MAIN MENU</h4>
                <nav className="menu-list">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation("/student"); }} className={`menu-item ${location.pathname === "/student" ? "active" : ""}`}><span className="menu-icon">📊</span><span>Dashboard</span></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation("/opportunity"); }} className={`menu-item ${location.pathname === "/opportunity" ? "active" : ""}`}><span className="menu-icon">💼</span><span>Opportunities</span></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation("/mentorship"); }} className={`menu-item ${location.pathname === "/mentorship" ? "active" : ""}`}><span className="menu-icon">🤝</span><span>Mentorship</span></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation("/events"); }} className={`menu-item ${location.pathname === "/events" ? "active" : ""}`}><span className="menu-icon">📅</span><span>Events</span></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation("/community"); }} className={`menu-item ${location.pathname === "/community" ? "active" : ""}`}><span className="menu-icon">💬</span><span>Community Feed</span></a>
                </nav>
              </div>
            </div>

            <div className="sidebar-footer">
              <div
                className="user-profile"
                role="button"
                tabIndex={0}
                onClick={handleProfileCardClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleProfileCardClick();
                  }
                }}
              >
                <div className="user-avatar">
                  {profilePicture ? (
                    <img
                      src={profilePicture.startsWith("http") ? profilePicture : `${API_HOST}${profilePicture}`}
                      alt="Profile"
                      className="user-avatar-img"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="user-info">
                  <p className="user-name">{displayName}</p>
                  <p className="user-role">{profileRoleLabel}</p>
                </div>
                <button className="user-menu-btn" type="button" aria-label="User menu">⋮</button>
              </div>
              <button className="logout-btn" type="button" onClick={handleLogout}>Logout</button>
            </div>
          </aside>
        )}

        <main className={isAlumni ? "alumni-main" : "events-main"}>{content}</main>
      </div>

      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          {isAlumni ? (
            <div className="events-profile-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
              <div className="events-profile-avatar-wrap">
                {profileData?.profilePicture || profilePicture ? (
                  <img
                    src={(profileData?.profilePicture || profilePicture).startsWith("http") ? (profileData?.profilePicture || profilePicture) : `${API_HOST}${profileData?.profilePicture || profilePicture}`}
                    alt="Profile"
                    className="events-profile-avatar"
                  />
                ) : (
                  <div className="events-profile-avatar-fallback">
                    {(profileData?.name || displayName).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="events-profile-title">Edit Profile</h3>
              <p className="events-profile-name">{profileData?.name || displayName}</p>
              <p className="events-profile-email">{profileData?.email || displayEmail}</p>
              <div className="events-profile-actions">
                <button type="button" className="events-profile-cancel" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button type="button" className="events-profile-edit" onClick={goToEditProfile}>
                  Open Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="sd-modal sd-profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sd-modal-header">
                <h3>👤 Edit Profile</h3>
                <button className="sd-modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
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
                          <div className="sd-profile-image-fallback">
                            {(profileForm.name || "S").charAt(0).toUpperCase()}
                          </div>
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

                    <form className="sd-profile-form" onSubmit={handleProfileSave}>
                      <label htmlFor="events-student-profile-name">Name</label>
                      <input
                        id="events-student-profile-name"
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => handleProfileFieldChange("name", e.target.value)}
                        required
                      />

                      <label htmlFor="events-student-profile-email">Email</label>
                      <input
                        id="events-student-profile-email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => handleProfileFieldChange("email", e.target.value)}
                        required
                      />

                      <label htmlFor="events-student-profile-phone">Phone</label>
                      <input
                        id="events-student-profile-phone"
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => handleProfileFieldChange("phone", e.target.value)}
                        required
                      />

                      <label htmlFor="events-student-profile-interests">Interests (comma separated)</label>
                      <textarea
                        id="events-student-profile-interests"
                        rows="2"
                        value={profileForm.interests}
                        onChange={(e) => handleProfileFieldChange("interests", e.target.value)}
                        placeholder="AI, Backend, Product"
                      />

                      <label htmlFor="events-student-profile-skills">Skills (comma separated)</label>
                      <textarea
                        id="events-student-profile-skills"
                        rows="2"
                        value={profileForm.skills}
                        onChange={(e) => handleProfileFieldChange("skills", e.target.value)}
                        placeholder="React, Node.js, SQL"
                      />

                      <div className="sd-profile-actions">
                        <button className="sd-profile-cancel" type="button" onClick={() => setShowProfileModal(false)}>
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
          )}
        </div>
      )}

      {profileToast && <div className={`sd-floating-toast ${profileToast.type}`}>{profileToast.msg}</div>}
    </div>
  );

  useEffect(() => {
    console.log("🚀 Events component mounted, fetching events...");
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const timer = setInterval(() => updateCountdowns(), 1000);
    return () => clearInterval(timer);
  }, [upcomingEvents, featuredEvent]);

  const fetchEvents = async () => {
    try {
      console.log("🔄 Fetching events from:", API_BASE);
      setLoading(true);
      const token = localStorage.getItem("token");

      // Get all events - NO AUTH REQUIRED
      console.log("📡 Getting all events...");
      const eventsRes = await axios.get(`${API_BASE}/events`);
      console.log("✅ Events response:", eventsRes.data);

      // Get featured event - NO AUTH REQUIRED
      console.log("📡 Getting featured event...");
      const featuredRes = await axios.get(`${API_BASE}/events/featured`);
      console.log("✅ Featured response:", featuredRes.data);

      // Get user's registered events (if authenticated)
      let myEventsRes = { data: { events: [] } };
      if (token) {
        try {
          console.log("📡 Getting registered events...");
          myEventsRes = await axios.get(`${API_BASE}/events/my/registered`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("✅ Registered events response:", myEventsRes.data);
        } catch (err) {
          console.log("⚠️ Not authenticated or no registered events:", err.message);
        }
      }

      setAllEvents(eventsRes.data.events || []);
      setFeaturedEvent(featuredRes.data.event);
      setMyEvents(myEventsRes.data.events || []);

      // Set registered events for UI
      const registeredIds = new Set(
        (myEventsRes.data.events || []).map(e => e._id)
      );
      setRegisteredEventIds(registeredIds);

      // Filter upcoming events (exclude featured)
      const upcoming = (eventsRes.data.events || []).filter(
        e => !featuredRes.data.event || e._id !== featuredRes.data.event._id
      );
      setUpcomingEvents(upcoming.slice(0, 12));

      console.log("✅ Events loaded successfully");
      console.log(`📊 Total events: ${(eventsRes.data.events || []).length}, Featured: ${featuredRes.data.event ? 'Yes' : 'No'}, My events: ${(myEventsRes.data.events || []).length}`);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching events:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(`Failed to load events: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  const updateCountdowns = () => {
    const newCountdowns = {};
    const now = new Date();

    [...(upcomingEvents || []), ...(featuredEvent ? [featuredEvent] : [])].forEach(event => {
      const eventDate = new Date(event.startDate);
      const diff = eventDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        newCountdowns[event._id] =
          days > 0
            ? `${days}d ${hours}h`
            : `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      } else {
        newCountdowns[event._id] = "Started";
      }
    });

    setCountdowns(newCountdowns);
  };

  const handleRegister = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRegisteredEventIds(new Set([...registeredEventIds, eventId]));
      fetchEvents(); // Refresh to update registered count
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register");
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/events/${eventId}/register`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newSet = new Set(registeredEventIds);
      newSet.delete(eventId);
      setRegisteredEventIds(newSet);
      fetchEvents(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unregister");
    }
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date TBA";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEventAttendanceStatus = (event) => {
    const endAt = new Date(event?.endDate || event?.startDate);
    if (Number.isNaN(endAt.getTime()) || endAt.getTime() > Date.now()) return null;

    const attended = Boolean(event?.isRegistered || registeredEventIds.has(event?._id));
    return attended ? "completed" : "unattended";
  };

  const getAttendanceLabel = (status) => (status === "completed" ? "Completed" : "Unattended");

  if (loading) {
    return renderShell(<div className="events-loading">Loading events...</div>);
  }

  if (error) {
    return renderShell(
      <div className="events-container">
        <div className="error-message" style={{ margin: '20px', padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  try {
    return renderShell(
      <div className="events-container">
        {/* Header */}
        <div className="events-header">
          <h1>Events</h1>
          <p>Connect with alumni and students through events</p>
        </div>

        {/* Featured Event */}
        {featuredEvent && (
          <div className="featured-event-section">
            <div className="featured-event-card">
              <div className="featured-badge">⭐ Featured</div>
              <div className="featured-header">
                <div className="featured-title">{featuredEvent.title}</div>
                <div className="featured-countdown">
                  <span className="countdown-label">Starts in</span>
                  <span className="countdown-time">{countdowns[featuredEvent._id]}</span>
                </div>
              </div>
              <p className="featured-description">{featuredEvent.description}</p>
              <div className="featured-meta">
                <div className="meta-item">
                  <span className="meta-label">By</span>
                  <span className="meta-value">{featuredEvent.organizerName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Date</span>
                  <span className="meta-value">{formatDate(featuredEvent.startDate)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Mode</span>
                  <span className={`mode-badge ${featuredEvent.mode}`}>
                    {featuredEvent.mode}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Attendees</span>
                  <span className="meta-value">
                    {featuredEvent.registrants?.length || 0}/{featuredEvent.capacity}
                  </span>
                </div>
              </div>
              <div className="featured-actions">
                {featuredEvent.meetingLink && (
                  <a
                    href={featuredEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-join-meeting"
                  >
                    📽️ Join Meeting
                  </a>
                )}
                {registeredEventIds.has(featuredEvent._id) ? (
                  <button
                    className="btn-unregister"
                    onClick={() => handleUnregister(featuredEvent._id)}
                  >
                    ✓ Registered
                  </button>
                ) : (
                  <button
                    className="btn-register"
                    onClick={() => handleRegister(featuredEvent._id)}
                  >
                    Register
                  </button>
                )}
                <button
                  className="btn-details"
                  onClick={() => openEventDetails(featuredEvent)}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="upcoming-events-section">
          <h2>Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <div className="events-empty-state">
              <p className="events-empty-title">No upcoming events yet</p>
              <p className="events-empty-subtitle">Check back soon for new workshops, webinars, and networking sessions.</p>
            </div>
          ) : (
            <div className="events-grid">
              {upcomingEvents.map(event => (
              (() => {
                const attendanceStatus = getEventAttendanceStatus(event);
                return (
              <div key={event._id} className="event-card">
                {event.isFeatured && <div className="badge-featured">Featured</div>}
                <div className="event-card-header">
                  <h3>{event.title}</h3>
                  <span className={`event-type-tag ${event.eventType}`}>
                    {event.eventType}
                  </span>
                </div>

                {attendanceStatus && (
                  <div className={`event-attendance-chip ${attendanceStatus}`}>
                    {getAttendanceLabel(attendanceStatus)}
                  </div>
                )}

                <p className="event-description">{event.description?.substring(0, 80)}...</p>

                <div className="event-details">
                  <div className="detail-row">
                    <span className="icon">👤</span>
                    <span>{event.organizerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">📅</span>
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">📍</span>
                    <span className={`mode-badge ${event.mode}`}>{event.mode}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">⏳</span>
                    <span className="countdown">{countdowns[event._id]}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">👥</span>
                    <span>{event.registrants?.length || 0}/{event.capacity}</span>
                  </div>
                </div>

                <div className="event-card-actions">
                  {event.meetingLink && (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                      title="Join meeting (requires registration)"
                    >
                      📽️ Meeting
                    </a>
                  )}
                  {registeredEventIds.has(event._id) ? (
                    <button
                      className="btn-registered"
                      onClick={() => handleUnregister(event._id)}
                    >
                      ✓ Registered
                    </button>
                  ) : (
                    <button
                      className="btn-register-small"
                      onClick={() => handleRegister(event._id)}
                      disabled={event.registrants?.length >= event.capacity}
                    >
                      {event.registrants?.length >= event.capacity ? "Full" : "Register"}
                    </button>
                  )}
                  <button
                    className="btn-view"
                    onClick={() => openEventDetails(event)}
                  >
                    View
                  </button>
                </div>
              </div>
                );
              })()
            ))}
            </div>
          )}
        </div>

        {/* My Registered Events */}
        {myEvents.length > 0 && (
          <div className="registered-events-section">
            <h2>My Registered Events</h2>
            <div className="registered-events-list">
              {myEvents.map(event => (
                (() => {
                  const attendanceStatus = getEventAttendanceStatus(event);
                  return (
                <div key={event._id} className="registered-event-item">
                  <div className="registered-event-content">
                    <div className="registered-title">
                      <span className="checkmark">✓</span>
                      <h4>{event.title}</h4>
                      {attendanceStatus && (
                        <span className={`event-attendance-chip ${attendanceStatus}`}>
                          {getAttendanceLabel(attendanceStatus)}
                        </span>
                      )}
                    </div>
                    <p className="registered-organizer">By {event.organizerName}</p>
                    <p className="registered-date">
                      📅 {formatDate(event.startDate)}
                    </p>
                    <p className="registered-mode">
                      📍 {event.mode} {event.location && `• ${event.location}`}
                    </p>
                  </div>
                  <div className="registered-actions">
                    {event.meetingLink && (
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-join"
                      >
                        Join Now
                      </a>
                    )}
                    <button
                      className="btn-view-details"
                      onClick={() => openEventDetails(event)}
                    >
                      Details
                    </button>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        )}

        {myEvents.length === 0 && (
          <div className="registered-events-section">
            <h2>My Registered Events</h2>
            <div className="events-empty-state compact">
              <p className="events-empty-title">You have not registered yet</p>
              <p className="events-empty-subtitle">Register for an event to track it here.</p>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showModal && selectedEvent && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>✕</button>
              <div className="modal-body">
                <h2>{selectedEvent.title}</h2>

                <div className="modal-section">
                  <h4>About</h4>
                  <p>{selectedEvent.description}</p>
                </div>

                <div className="modal-section">
                  <h4>Details</h4>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="label">Organizer:</span>
                      <span className="value">{selectedEvent.organizerName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Type:</span>
                      <span className="value">{selectedEvent.eventType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Mode:</span>
                      <span className={`value mode-badge ${selectedEvent.mode}`}>
                        {selectedEvent.mode}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Start:</span>
                      <span className="value">{formatDate(selectedEvent.startDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">End:</span>
                      <span className="value">{formatDate(selectedEvent.endDate)}</span>
                    </div>
                    {selectedEvent.location && (
                      <div className="detail-item">
                        <span className="label">Location:</span>
                        <span className="value">{selectedEvent.location}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="label">Capacity:</span>
                      <span className="value">
                        {selectedEvent.registrants?.length || 0}/{selectedEvent.capacity}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div className="modal-section">
                    <h4>Tags</h4>
                    <div className="tags-container">
                      {selectedEvent.tags.map((tag, idx) => (
                        <span key={idx} className="tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  {selectedEvent.meetingLink && (
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-modal-join"
                    >
                      📽️ Join Meeting
                    </a>
                  )}
                  {registeredEventIds.has(selectedEvent._id) ? (
                    <button
                      className="btn-modal-unregister"
                      onClick={() => {
                        handleUnregister(selectedEvent._id);
                        closeModal();
                      }}
                    >
                      Unregister
                    </button>
                  ) : (
                    <button
                      className="btn-modal-register"
                      onClick={() => {
                        handleRegister(selectedEvent._id);
                        closeModal();
                      }}
                      disabled={selectedEvent.registrants?.length >= selectedEvent.capacity}
                    >
                      {selectedEvent.registrants?.length >= selectedEvent.capacity
                        ? "Event Full"
                        : "Register Now"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    );
  } catch (renderError) {
    console.error("❌ Render error in Events component:", renderError);
    return renderShell(
      <div className="events-container">
        <div className="error-message" style={{ margin: '20px', padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
          <strong>Render Error:</strong> {renderError.message}
          <br />
          <code>{renderError.stack}</code>
        </div>
      </div>
    );
  }
};

export default Events;

