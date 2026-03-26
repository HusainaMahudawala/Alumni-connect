import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/AdminShell.css";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingReportId, setReviewingReportId] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = useCallback(async () => {
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
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const reviewReport = async (reportId, decision) => {
    try {
      setReviewingReportId(reportId);
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:5000/api/opportunity/admin/reports/${reportId}/review`,
        { decision },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setError("");
      await fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review report");
    } finally {
      setReviewingReportId(null);
    }
  };

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
              <article className="admin-stat-card">
                <h2>Pending Opportunity Reports</h2>
                <p>{stats.pendingOpportunityReports || 0}</p>
              </article>
            </section>
          ) : null}

          {stats?.recentOpportunityReports?.length ? (
            <section className="admin-reports-section">
              <h2>Recent Reported Opportunities</h2>
              <div className="admin-reports-table-wrap">
                <table className="admin-reports-table">
                  <thead>
                    <tr>
                      <th>Opportunity</th>
                      <th>Reported By</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                      <th>Reported At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOpportunityReports.map((report) => (
                      <tr key={report._id}>
                        <td>
                          <div className="admin-report-title">{report.opportunity?.title || "Unknown"}</div>
                          <div className="admin-report-sub">{report.opportunity?.company || "-"}</div>
                        </td>
                        <td>
                          <div className="admin-report-title">{report.reportedBy?.name || "Unknown"}</div>
                          <div className="admin-report-sub">{report.reportedBy?.email || "-"}</div>
                        </td>
                        <td className="admin-report-reason">{report.reason}</td>
                        <td>
                          <span className={`admin-report-status ${report.status || "pending"}`}>
                            {report.status || "pending"}
                          </span>
                        </td>
                        <td>
                          {report.status === "pending" ? (
                            <div className="admin-report-actions">
                              <button
                                type="button"
                                className="admin-action-btn approve"
                                disabled={reviewingReportId === report._id}
                                onClick={() => reviewReport(report._id, "approved")}
                              >
                                Approve Job
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn reject"
                                disabled={reviewingReportId === report._id}
                                onClick={() => reviewReport(report._id, "rejected")}
                              >
                                Reject Job
                              </button>
                            </div>
                          ) : (
                            <span className="admin-reviewed-note">
                              Reviewed ({report.reviewDecision || "-"})
                            </span>
                          )}
                        </td>
                        <td>{new Date(report.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
