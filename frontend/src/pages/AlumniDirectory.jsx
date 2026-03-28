import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationBell from "../components/NotificationBell";
import AlumniCard from "../components/AlumniCard";
import "./AlumniDashboard.css";
import "./AlumniDirectory.css";

const API_BASE = "http://localhost:5000/api";

const initialFilters = {
  graduationYear: "",
  industry: "",
  company: "",
  location: ""
};

function AlumniDirectory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlumni, setTotalAlumni] = useState(0);
  const [availableFilters, setAvailableFilters] = useState({
    graduationYears: [],
    industries: [],
    companies: [],
    locations: []
  });

  const [connectTarget, setConnectTarget] = useState(null);
  const [connectNote, setConnectNote] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  const [collabTarget, setCollabTarget] = useState(null);
  const [collabType, setCollabType] = useState("mentorship collaboration");
  const [collabNote, setCollabNote] = useState("");
  const [collabLoading, setCollabLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchAlumni = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const endpoint = searchQuery ? `${API_BASE}/alumni/search` : `${API_BASE}/alumni`;

        const params = {
          page,
          limit,
          graduationYear: filters.graduationYear,
          industry: filters.industry,
          company: filters.company,
          location: filters.location
        };

        if (searchQuery) {
          params.query = searchQuery;
        }

        const res = await axios.get(endpoint, { headers, params });

        setAlumni(res.data?.data || []);
        setTotalPages(res.data?.totalPages || 1);
        setTotalAlumni(res.data?.totalAlumni || 0);
        setAvailableFilters(
          res.data?.availableFilters || {
            graduationYears: [],
            industries: [],
            companies: [],
            locations: []
          }
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load alumni directory");
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [page, limit, searchQuery, filters]);

  const displayName = storedUser?.name || "Alumni";
  const displayEmail = storedUser?.email || "alumni@portal.com";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const applySearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleFilterChange = (name, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnect = async () => {
    if (!connectTarget) return;

    setConnectLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/alumni/${connectTarget._id}/connect`,
        { note: connectNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Connection request sent.");
      setConnectTarget(null);
      setConnectNote("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send connection request", "error");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleCollaboration = async () => {
    if (!collabTarget) return;

    setCollabLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/alumni/${collabTarget._id}/collaborate`,
        {
          collaborationType: collabType,
          note: collabNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Collaboration offer sent.");
      setCollabTarget(null);
      setCollabType("mentorship collaboration");
      setCollabNote("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send collaboration offer", "error");
    } finally {
      setCollabLoading(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const start = Math.max(page - 1, 1);
    const end = Math.min(start + 2, totalPages);

    for (let current = start; current <= end; current += 1) {
      pages.push(
        <button
          key={current}
          type="button"
          className={`page-btn ${current === page ? "active" : ""}`}
          onClick={() => setPage(current)}
        >
          {current}
        </button>
      );
    }

    return (
      <div className="pagination-wrap">
        <button type="button" className="page-btn" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
          Prev
        </button>
        {pages}
        <button
          type="button"
          className="page-btn"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="alumni-jobs-dashboard">
      <header className="alumni-topbar">
        <div className="topbar-brand">
          <div className="brand-icon">AL</div>
          <div className="brand-copy">
            <p className="brand-main">AlumniConnect</p>
            <p className="brand-sub">Alumni Directory</p>
          </div>
        </div>

        <div className="topbar-actions">
          <form className="topbar-search" onSubmit={applySearch}>
            <span className="topbar-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search alumni by name, company, skills..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <NotificationBell />
        </div>
      </header>

      <div className="alumni-shell">
        <aside className="alumni-sidebar">
          <div className="sidebar-menu-wrap">
            <p className="sidebar-menu-title">Menu</p>
            <nav className="sidebar-menu-list">
              <button
                type="button"
                onClick={() => navigate("/alumni-dashboard")}
                className={`sidebar-menu-item ${location.pathname === "/alumni-dashboard" ? "active" : ""}`}
              >
                <span>📊</span>
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/alumni-directory")}
                className={`sidebar-menu-item ${location.pathname.startsWith("/alumni-directory") ? "active" : ""}`}
              >
                <span>👥</span>
                Alumni Directory
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-opportunities")}
                className="sidebar-menu-item"
              >
                <span>💼</span>
                Jobs Board
              </button>
              <button
                type="button"
                onClick={() => navigate("/community")}
                className={`sidebar-menu-item ${location.pathname === "/community" ? "active" : ""}`}
              >
                <span>🗣</span>
                Community Feed
              </button>
              <button type="button" className="sidebar-menu-item muted">
                <span>📅</span>
                Events
              </button>
              <button
                type="button"
                onClick={() => navigate("/mentorship-requests")}
                className="sidebar-menu-item"
              >
                <span>🤝</span>
                Mentorship
              </button>
            </nav>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div>
              <p className="profile-name">{displayName}</p>
              <p className="profile-role">Alumni Member</p>
              <p className="profile-email">{displayEmail}</p>
            </div>
          </div>

          <button className="sidebar-logout" type="button" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main className="alumni-main">
          <section className="page-heading">
            <h1>Alumni Directory</h1>
            <p>Connect with fellow alumni and grow your professional network.</p>
          </section>

          <section className="directory-meta-strip">
            <div>
              <p className="meta-label">Total Alumni</p>
              <h3>{totalAlumni}</h3>
            </div>
            <button type="button" className="clear-filter-btn" onClick={clearFilters}>
              Reset Search & Filters
            </button>
          </section>

          <section className="directory-filter-panel">
            <div className="filter-grid">
              <label>
                Graduation Year
                <select
                  value={filters.graduationYear}
                  onChange={(e) => handleFilterChange("graduationYear", e.target.value)}
                >
                  <option value="">All</option>
                  {availableFilters.graduationYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Industry
                <select value={filters.industry} onChange={(e) => handleFilterChange("industry", e.target.value)}>
                  <option value="">All</option>
                  {availableFilters.industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Company
                <select value={filters.company} onChange={(e) => handleFilterChange("company", e.target.value)}>
                  <option value="">All</option>
                  {availableFilters.companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Location
                <select value={filters.location} onChange={(e) => handleFilterChange("location", e.target.value)}>
                  <option value="">All</option>
                  {availableFilters.locations.map((locationOption) => (
                    <option key={locationOption} value={locationOption}>
                      {locationOption}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {loading && (
            <section className="directory-state-wrap">
              <div className="spinner" />
              <p>Loading alumni...</p>
            </section>
          )}

          {!loading && error && (
            <section className="directory-state-wrap error">
              <p>{error}</p>
            </section>
          )}

          {!loading && !error && alumni.length === 0 && (
            <section className="directory-state-wrap">
              <p className="empty-title">No alumni found</p>
              <p className="empty-subtitle">Try a different keyword or clear filters.</p>
            </section>
          )}

          {!loading && !error && alumni.length > 0 && (
            <section className="alumni-grid">
              {alumni.map((member) => (
                <AlumniCard
                  key={member._id}
                  alumni={member}
                  onViewProfile={(selected) => navigate(`/alumni-directory/${selected._id}`)}
                  onConnect={(selected) => setConnectTarget(selected)}
                  onCollaborate={(selected) => setCollabTarget(selected)}
                />
              ))}
            </section>
          )}

          {!loading && !error && renderPagination()}
        </main>
      </div>

      {connectTarget && (
        <div className="alumni-modal-backdrop" onClick={() => setConnectTarget(null)}>
          <div className="alumni-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Connect with {connectTarget.name}</h3>
            <p>Send a short message with your connection request.</p>
            <textarea
              rows={4}
              placeholder="Hi, I would love to connect and learn from your journey."
              value={connectNote}
              onChange={(e) => setConnectNote(e.target.value)}
            />
            <div className="alumni-modal-actions">
              <button type="button" onClick={() => setConnectTarget(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleConnect} disabled={connectLoading}>
                {connectLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {collabTarget && (
        <div className="alumni-modal-backdrop" onClick={() => setCollabTarget(null)}>
          <div className="alumni-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Offer Collaboration to {collabTarget.name}</h3>
            <label className="collab-label">
              Collaboration Type
              <select value={collabType} onChange={(e) => setCollabType(e.target.value)}>
                <option value="mentorship collaboration">Mentorship Collaboration</option>
                <option value="project collaboration">Project Collaboration</option>
                <option value="job referral collaboration">Job Referral Collaboration</option>
              </select>
            </label>
            <textarea
              rows={4}
              placeholder="Describe your collaboration idea..."
              value={collabNote}
              onChange={(e) => setCollabNote(e.target.value)}
            />
            <div className="alumni-modal-actions">
              <button type="button" onClick={() => setCollabTarget(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleCollaboration} disabled={collabLoading}>
                {collabLoading ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`directory-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default AlumniDirectory;
