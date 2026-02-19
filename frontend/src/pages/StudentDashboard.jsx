import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
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
      } catch (error) {
        console.log(error);
        navigate("/");
      }
    };

    fetchDashboard();
  }, [navigate]);
  console.log(studentData);

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
          <h1>Welcome, {studentData?.name || "Student"} 👋</h1>
          <p>{studentData?.email}</p>
        </div>
        <div className="dashboard-grid">
  <div className="dashboard-card">
    <h3>Applied Opportunities</h3>
    <p className="count">
      {studentData?.appliedOpportunities ?? 0}
    </p>
  </div>

  <div className="dashboard-card">
    <h3>Pending Mentorships</h3>
    <p className="count">
      {studentData?.pendingMentorships ?? 0}
    </p>
  </div>

  <div className="dashboard-card">
    <h3>Approved Mentorships</h3>
    <p className="count">
      {studentData?.approvedMentorships ?? 0}
    </p>
  </div>
</div>
<div className="dashboard-card" onClick={() => navigate("/opportunities")}>
  <h3>Opportunities</h3>
  <p>Click to view and apply</p>
</div>


      </div>
    </div>
  );
}

export default StudentDashboard;
