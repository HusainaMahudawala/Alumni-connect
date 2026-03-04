import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Mentorship.css";

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
      fetchMyRequests();
    } catch (error) {
      setNotification({
        type: "error",
        text: error.response?.data?.message || "Error occurred"
      });
    }
  };

  const checkStatus = (alumniId) => {
    const found = myRequests.find(
      (req) => req.alumni._id === alumniId
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

        {/* Center - Search Bar */}
        <div className="navbar-center">
          <div className="search-bar">
          
            <input
              type="text"
              placeholder="Search mentors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
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