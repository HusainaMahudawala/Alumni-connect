import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

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
  const recentActivities = studentData ? [
    {
      id: 1,
      type: "opportunity",
      title: `You have applied to ${studentData.appliedOpportunities || 0} internship opportunities`,
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
          <button className="notification-btn">🔔</button>
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
              <h1 className="page-title">Dashboard</h1>
              <p className="header-subtitle">Welcome back, Student!</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="dashboard-section">
            <h2 className="section-title">Dashboard</h2>
            <p className="section-subtitle">Welcome back! Here's what's happening today.</p>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <h3>Active Courses</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#dbeafe" }}>📖</span>
                </div>
                <p className="stat-number">5</p>
                <p className="stat-detail">2 due soon</p>
                <a href="#" className="stat-link">View all →</a>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Pending Mentorships</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#dcfce7" }}>⏳</span>
                </div>
                <p className="stat-number">{studentData?.pendingMentorships ?? 0}</p>
                <p className="stat-detail">Awaiting response</p>
                <a href="#" className="stat-link">View all →</a>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Approved Mentorships</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#f3e8ff" }}>✅</span>
                </div>
                <p className="stat-number">{studentData?.approvedMentorships ?? 0}</p>
                <p className="stat-detail">Active mentors</p>
                <a href="#" className="stat-link">View all →</a>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Internship Applications</h3>
                  <span className="stat-icon" style={{ backgroundColor: "#fef3c7" }}>💼</span>
                </div>
                <p className="stat-number">{studentData?.appliedOpportunities ?? 0}</p>
                <p className="stat-detail">Applied opportunities</p>
                <a href="#" className="stat-link">View all →</a>
              </div>
            </div>
          </div>

          {/* Bottom Section - Recent Activities & Quick Stats */}
          <div className="bottom-section">
            {/* Recent Activities */}
            <div className="recent-activities">
              <div className="section-header">
                <h2 className="section-title">Recent Activities</h2>
                <a href="#" className="view-all-link">View All</a>
              </div>

              <div className="activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <h2 className="section-title">Quick Stats</h2>

              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">Mentorship Progress</span>
                  <span className="progress-percent">
                    {studentData?.approvedMentorships || 0}/{(studentData?.approvedMentorships || 0) + (studentData?.pendingMentorships || 0)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: studentData ? `${(studentData.approvedMentorships / ((studentData.approvedMentorships + studentData.pendingMentorships) || 1)) * 100}%` : "0%",
                      backgroundColor: "#a855f7"
                    }}
                  ></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">Internship Applications</span>
                  <span className="progress-percent">{studentData?.appliedOpportunities || 0}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min((studentData?.appliedOpportunities || 0) * 10, 100)}%`,
                      backgroundColor: "#10b981"
                    }}
                  ></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">Pending Requests</span>
                  <span className="progress-percent">{studentData?.pendingMentorships || 0}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min((studentData?.pendingMentorships || 0) * 15, 100)}%`,
                      backgroundColor: "#f59e0b"
                    }}
                  ></div>
                </div>
              </div>

              <button className="detailed-analytics-btn">
                View Detailed Analytics 📊
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentDashboard;
