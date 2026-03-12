import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ViewApplicants.css";

function ViewApplicants() {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/opportunity/applicants",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setData(res.data);
    } catch (error) {
      console.error("Error fetching applicants:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="applicants-wrapper">
        <div className="applicants-topbar">
          <div className="topbar-brand">
            <div className="brand-icon">🎓</div>
            <div className="brand-copy">
              <p className="brand-main">AlumniConnect</p>
              <p className="brand-sub">Alumni Portal</p>
            </div>
          </div>
        </div>
        <div className="applicants-container">
          <p className="loading-text">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applicants-wrapper">
      <header className="applicants-topbar">
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

      <div className="applicants-shell">
        <aside className="applicants-sidebar">
          <div className="sidebar-menu-wrap">
            <p className="sidebar-menu-title">Menu</p>
            <nav className="sidebar-menu-list">
              <button
                type="button"
                onClick={() => navigate("/alumni-dashboard")}
                className="sidebar-menu-item"
              >
                <span>📊</span>
                Dashboard
              </button>
              <button type="button" className="sidebar-menu-item muted">
                <span>👥</span>
                Alumni Directory
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-opportunities")}
                className="sidebar-menu-item"
              >
                <span>💼</span>
                Jobs Board
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
                className="sidebar-menu-item"
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

        <main className="applicants-main">
      <div className="applicants-container">
      <div className="applicants-header">
        <h1>Job Applicants</h1>
        <p>View all students who have applied to your posted opportunities</p>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Opportunities Posted Yet</h3>
          <p>Post job opportunities to start receiving applications from students</p>
        </div>
      ) : (
        <div className="opportunities-list">
          {data.map(opportunity => (
            <div key={opportunity._id} className="opportunity-card">
              <div className="opportunity-header">
                <div className="opportunity-info">
                  <h2>{opportunity.title}</h2>
                  <p className="company-name">{opportunity.company}</p>
                  <div className="opportunity-meta">
                    <span className="meta-badge">{opportunity.type}</span>
                    <span className="meta-badge">{opportunity.workMode}</span>
                    <span className="meta-location">📍 {opportunity.location || "Remote"}</span>
                  </div>
                </div>
                <div className="applicant-count">
                  <div className="count-number">{opportunity.applicants?.length || 0}</div>
                  <div className="count-label">Applicants</div>
                </div>
              </div>

              <div className="applicants-section">
                {opportunity.applicants && opportunity.applicants.length > 0 ? (
                  <div className="applicants-grid">
                    {opportunity.applicants.map((student, index) => (
                      <div key={student._id} className="applicant-card">
                        <div className="applicant-avatar">
                          {student.name?.charAt(0).toUpperCase() || "S"}
                        </div>
                        <div className="applicant-info">
                          <h4 className="applicant-name">{student.name}</h4>
                          <p className="applicant-email">{student.email}</p>
                          {student.phone && (
                            <p className="applicant-phone">📞 {student.phone}</p>
                          )}
                        </div>
                        <div className="applicant-number">#{index + 1}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-applicants">
                    <p>No students have applied to this opportunity yet</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
        </main>
      </div>
    </div>
  );
}

export default ViewApplicants;