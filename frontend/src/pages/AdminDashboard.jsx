import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/AdminShell.css";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:5000/api/dashboard/admin", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin dashboard");

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("user");
          navigate("/admin/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return <div className="admin-dashboard-page">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-shell-layout">
      <AdminSidebar />
      <main className="admin-main-content">
        <div className="admin-dashboard-page">
          <header className="admin-dashboard-header">
            <h1>Admin Dashboard</h1>
          </header>

          {error ? <div className="admin-dashboard-error">{error}</div> : null}

          {stats ? (
            <section className="admin-stats-grid">
              <article className="admin-stat-card">
                <h2>Total Users</h2>
                <p>{stats.totalUsers}</p>
              </article>
              <article className="admin-stat-card">
                <h2>Total Alumni</h2>
                <p>{stats.totalAlumni}</p>
              </article>
              <article className="admin-stat-card">
                <h2>Total Students</h2>
                <p>{stats.totalStudents}</p>
              </article>
              <article className="admin-stat-card">
                <h2>Total Opportunities</h2>
                <p>{stats.totalOpportunities}</p>
              </article>
              <article className="admin-stat-card">
                <h2>Pending Opportunities for Approval</h2>
                <p>{stats.pendingOpportunities}</p>
              </article>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
