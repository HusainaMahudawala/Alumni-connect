import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/AdminShell.css";
import "./AdminMentorshipRequests.css";

const API_BASE = "http://localhost:5000/api";

function AdminMentorshipRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/mentorship/admin/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setRequests(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load mentorship requests");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="admin-shell-layout">
      <AdminSidebar />
      <main className="admin-main-content">
        <h1 className="admin-mentorship-title">Mentorship Requests</h1>

        {error ? <div className="admin-mentorship-error">{error}</div> : null}

        {loading ? (
          <div className="admin-mentorship-loading">Loading mentorship requests...</div>
        ) : (
          <div className="admin-mentorship-table-wrap">
            <table className="admin-mentorship-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Alumni</th>
                  <th>Purpose</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-row">No mentorship requests found.</td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id}>
                      <td>{req.student?.name || "-"}</td>
                      <td>{req.alumni?.name || "-"}</td>
                      <td>{req.purpose || "-"}</td>
                      <td>{req.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminMentorshipRequests;
