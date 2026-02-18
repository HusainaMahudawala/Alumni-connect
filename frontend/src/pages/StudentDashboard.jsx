import { useNavigate } from "react-router-dom";
import React from "react";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <div className="dashboard">
      <nav className="dashboard-navbar">
        <h2>AlumniConnect</h2>
       <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Welcome, Student 👋</h1>
          <p>Explore opportunities and connect with alumni mentors.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Opportunities</h3>
            <p>View jobs, internships, and hackathons.</p>
          </div>

          <div className="dashboard-card">
            <h3>Mentorship</h3>
            <p>Apply for mentorship with alumni.</p>
          </div>

          <div className="dashboard-card">
            <h3>Applications</h3>
            <p>Track your applied opportunities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
