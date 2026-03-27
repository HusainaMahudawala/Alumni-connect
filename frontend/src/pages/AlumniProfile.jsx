import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AlumniDashboard.css";
import "./AlumniProfile.css";

const API_BASE = "http://localhost:5000/api";
const API_HOST = "http://localhost:5000";

function profileImageUrl(profilePicture) {
  if (!profilePicture) return "";
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${API_HOST}${profilePicture}`;
}

function renderExperience(experience) {
  if (!experience) return "Experience details are not available.";
  if (Array.isArray(experience)) {
    return experience.join(", ");
  }
  if (typeof experience === "object") {
    return JSON.stringify(experience);
  }
  return String(experience);
}

function AlumniProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/alumni/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load alumni profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const displayName = storedUser?.name || "Alumni";
  const displayEmail = storedUser?.email || "alumni@portal.com";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="alumni-jobs-dashboard">
      <header className="alumni-topbar">
        <div className="topbar-brand">
          <div className="brand-icon">AL</div>
          <div className="brand-copy">
            <p className="brand-main">AlumniConnect</p>
            <p className="brand-sub">Alumni Profile</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="profile-back-btn" type="button" onClick={() => navigate("/alumni-profile/edit")}>
            Edit My Profile
          </button>
          <button className="profile-back-btn" type="button" onClick={() => navigate("/alumni-directory")}>
            Back to Directory
          </button>
        </div>
      </header>

      <div className="alumni-shell">
        <aside className="alumni-sidebar">
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
                className={`sidebar-menu-item ${location.pathname.startsWith("/alumni-directory") ? "active" : ""}`}
              >
                <span>👥</span>
                Alumni Directory
              </button>
              <button
                type="button"
                onClick={() => navigate("/alumni-profile/edit")}
                className={`sidebar-menu-item ${location.pathname === "/alumni-profile/edit" ? "active" : ""}`}
              >
                <span>✍</span>
                Edit Profile
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

        <main className="alumni-main">
          {loading && (
            <section className="profile-state">
              <div className="spinner" />
              <p>Loading profile...</p>
            </section>
          )}

          {!loading && error && (
            <section className="profile-state error">
              <p>{error}</p>
            </section>
          )}

          {!loading && !error && profile && (
            <section className="alumni-profile-card">
              <div className="profile-hero">
                {profileImageUrl(profile.profilePicture) ? (
                  <img src={profileImageUrl(profile.profilePicture)} alt={profile.name} />
                ) : (
                  <div className="profile-hero-fallback">{(profile.name || "A").charAt(0).toUpperCase()}</div>
                )}

                <div>
                  <h1>{profile.name}</h1>
                  <p>{profile.jobTitle || "Professional"}</p>
                  <p>
                    {profile.currentCompany || "Company not listed"} • {profile.location || "Location not listed"}
                  </p>
                </div>
              </div>

              <div className="profile-grid">
                <article>
                  <h3>Bio</h3>
                  <p>{profile.bio || "No bio added yet."}</p>
                </article>

                <article>
                  <h3>Career Journey</h3>
                  <p>{profile.careerJourney || "Career journey details are not available."}</p>
                </article>

                <article>
                  <h3>Skills</h3>
                  <div className="profile-skills">
                    {(profile.skills || []).length > 0 ? (
                      profile.skills.map((skill) => <span key={skill}>{skill}</span>)
                    ) : (
                      <p>No skills listed.</p>
                    )}
                  </div>
                </article>

                <article>
                  <h3>Experience</h3>
                  <p>{renderExperience(profile.experience)}</p>
                </article>

                <article>
                  <h3>Contact Links</h3>
                  <ul>
                    <li>Email: {profile.email || "Not available"}</li>
                    <li>
                      LinkedIn:{" "}
                      {profile.linkedin ? (
                        <a href={profile.linkedin} target="_blank" rel="noreferrer">
                          Open Profile
                        </a>
                      ) : (
                        "Not available"
                      )}
                    </li>
                  </ul>
                </article>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default AlumniProfile;
