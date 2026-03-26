import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/AdminShell.css";
import "./ManageOpportunities.css";

const API_BASE = "http://localhost:5000/api";

function ManageOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const navigate = useNavigate();

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/opportunity/admin/all`, getAuthHeaders());
      setOpportunities(res.data || []);
      setError("");
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/admin/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const updateStatus = async (id, status) => {
    setActionLoadingId(id);
    try {
      await axios.patch(
        `${API_BASE}/opportunity/admin/${id}/status`,
        { status },
        getAuthHeaders()
      );
      await loadOpportunities();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteOpportunity = async (id) => {
    const isConfirmed = window.confirm("Delete this opportunity permanently?");
    if (!isConfirmed) return;

    setActionLoadingId(id);
    try {
      await axios.delete(`${API_BASE}/opportunity/admin/${id}`, getAuthHeaders());
      await loadOpportunities();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete opportunity");
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusClassName = (status) => {
    if (status === "approved") return "status approved";
    if (status === "rejected") return "status rejected";
    return "status pending";
  };

  return (
    <div className="admin-shell-layout">
      <AdminSidebar />
      <main className="admin-main-content">
        <div className="manage-opportunities-page">
          <header className="manage-opportunities-header">
            <div>
              <h1>Manage Opportunities</h1>
              <p>Approve, reject, or delete alumni-posted opportunities.</p>
            </div>
          </header>

          {error ? <div className="manage-opportunities-error">{error}</div> : null}

          {loading ? (
            <div className="manage-opportunities-loading">Loading opportunities...</div>
          ) : (
            <div className="manage-opportunities-table-wrap">
              <table className="manage-opportunities-table">
                <thead>
                  <tr>
                    <th>Opportunity Title</th>
                    <th>Company</th>
                    <th>Posted By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">No opportunities found.</td>
                    </tr>
                  ) : (
                    opportunities.map((opp) => {
                      const isBusy = actionLoadingId === opp._id;
                      return (
                        <tr key={opp._id}>
                          <td>{opp.title || "-"}</td>
                          <td>{opp.company || "-"}</td>
                          <td>{opp.postedBy?.name || "Unknown Alumni"}</td>
                          <td>
                            <span className={statusClassName(opp.status)}>{(opp.status || "pending").toUpperCase()}</span>
                          </td>
                          <td>
                            <div className="action-group">
                              <button
                                type="button"
                                disabled={isBusy || opp.status === "approved"}
                                className="action-btn approve"
                                onClick={() => updateStatus(opp._id, "approved")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={isBusy || opp.status === "rejected"}
                                className="action-btn reject"
                                onClick={() => updateStatus(opp._id, "rejected")}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                className="action-btn delete"
                                onClick={() => deleteOpportunity(opp._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ManageOpportunities;
