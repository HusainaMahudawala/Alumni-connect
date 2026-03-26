import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/AdminShell.css";
import "./ManageUsers.css";

const API_BASE = "http://localhost:5000/api";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const loadUsers = useCallback(async (role = filterRole) => {
    setLoading(true);
    try {
      const query = role === "all" ? "" : `?role=${role}`;
      const res = await axios.get(`${API_BASE}/users/admin/all${query}`, getHeaders());
      setUsers(res.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onFilterChange = (e) => {
    const next = e.target.value;
    setFilterRole(next);
    loadUsers(next);
  };

  const deleteUser = async (id) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/users/admin/${id}`, getHeaders());
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="admin-shell-layout">
      <AdminSidebar />
      <main className="admin-main-content">
        <div className="manage-users-header">
          <h1>Manage Users</h1>
          <select value={filterRole} onChange={onFilterChange}>
            <option value="all">All Users</option>
            <option value="student">Students</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        {error ? <div className="manage-users-error">{error}</div> : null}

        {loading ? (
          <div className="manage-users-loading">Loading users...</div>
        ) : (
          <div className="manage-users-table-wrap">
            <table className="manage-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">No users found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.company || "-"}</td>
                      <td>
                        {user.role === "admin" ? (
                          <span className="protected-label">Protected</span>
                        ) : (
                          <button className="delete-user-btn" type="button" onClick={() => deleteUser(user._id)}>Delete</button>
                        )}
                      </td>
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

export default ManageUsers;
