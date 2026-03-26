import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand-icon">🛡️</div>
        <div>
          <p className="admin-brand-title">AlumniConnect</p>
          <p className="admin-brand-sub">Admin Panel</p>
        </div>
      </div>

      <nav className="admin-nav">
        <button type="button" className={`admin-nav-item ${isActive("/admin/dashboard") ? "active" : ""}`} onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
        <button type="button" className={`admin-nav-item ${isActive("/admin/manage-users") ? "active" : ""}`} onClick={() => navigate("/admin/manage-users")}>Manage Users</button>
        <button type="button" className={`admin-nav-item ${isActive("/admin/manage-opportunities") ? "active" : ""}`} onClick={() => navigate("/admin/manage-opportunities")}>Manage Opportunities</button>
        <button type="button" className={`admin-nav-item ${isActive("/admin/mentorship-requests") ? "active" : ""}`} onClick={() => navigate("/admin/mentorship-requests")}>Mentorship Requests</button>
        <button type="button" className="admin-nav-item logout" onClick={logout}>Logout</button>
      </nav>
    </aside>
  );
}

export default AdminSidebar;
