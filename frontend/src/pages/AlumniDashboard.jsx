import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AlumniDashboard.css";
import "./MyOpportunities.css";

const API_BASE = "http://localhost:5000/api";

function formatType(value) {
  if (!value) return "Unknown";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRelativeDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}

function AlumniDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [summary, setSummary] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const emptyPost = { title: "", company: "", location: "", type: "full-time", workMode: "onsite", salaryStipend: "", overview: "", responsibilities: "", requiredSkills: "", preferredSkills: "" };
  const [postModal, setPostModal] = useState(false);
  const [postForm, setPostForm] = useState(emptyPost);
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState(null);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, myOppRes, applicantsRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/alumni`, { headers }),
          axios.get(`${API_BASE}/opportunity/my`, { headers }),
          axios.get(`${API_BASE}/opportunity/applicants`, { headers })
        ]);

        const applicantsMap = applicantsRes.data.reduce((acc, job) => {
          acc[job._id] = job.applicants?.length || 0;
          return acc;
        }, {});

        const mergedOpps = (myOppRes.data || []).map((job) => ({
          ...job,
          applicantsCount: applicantsMap[job._id] ?? job.applicants?.length ?? 0
        }));

        const totalApplicants = mergedOpps.reduce(
          (sum, job) => sum + (job.applicantsCount || 0),
          0
        );

        setSummary({
          ...summaryRes.data,
          postedOpportunities:
            summaryRes.data?.postedOpportunities ?? mergedOpps.length,
          totalApplicants
        });
        setOpportunities(mergedOpps);
      } catch (err) {
        console.log(err);
        setError(err.response?.data?.message || "Failed to load alumni dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((job) => {
        const query = search.trim().toLowerCase();
        const searchable = [
          job.title,
          job.company,
          job.location,
          ...(job.requiredSkills || []),
          ...(job.preferredSkills || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchSearch = !query || searchable.includes(query);

        const matchActivity =
          activityFilter === "all" ||
          (activityFilter === "with-applicants" && (job.applicantsCount || 0) > 0) ||
          (activityFilter === "no-applicants" && (job.applicantsCount || 0) === 0) ||
          (activityFilter === "recent" && Date.now() - new Date(job.createdAt).getTime() <= 1000 * 60 * 60 * 24 * 7);

        const matchType = typeFilter === "all" || job.type === typeFilter;
        const matchMode = modeFilter === "all" || job.workMode === modeFilter;

        return matchSearch && matchActivity && matchType && matchMode;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [opportunities, search, activityFilter, typeFilter, modeFilter]);

  const clearFilters = () => {
    setSearch("");
    setActivityFilter("all");
    setTypeFilter("all");
    setModeFilter("all");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePostSubmit = async () => {
    if (!postForm.title.trim() || !postForm.company.trim()) {
      showToast("Job title and company are required.", "error");
      return;
    }
    setPosting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/opportunity`, postForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostModal(false);
      setPostForm(emptyPost);
      showToast("Opportunity posted successfully!");
      // refresh stats
      const token2 = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token2}` };
      const [summaryRes, myOppRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/alumni`, { headers }),
        axios.get(`${API_BASE}/opportunity/my`, { headers }),
      ]);
      setOpportunities(myOppRes.data || []);
      setSummary((prev) => ({ ...prev, postedOpportunities: (myOppRes.data || []).length, ...summaryRes.data }));
    } catch {
      showToast("Failed to post opportunity.", "error");
    } finally {
      setPosting(false);
    }
  };

  const displayName = summary?.name || storedUser?.name || "Alumni";
  const displayEmail = summary?.email || storedUser?.email || "alumni@portal.com";

  return (
    <div className="alumni-jobs-dashboard">
      <header className="alumni-topbar">
        <div className="topbar-brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-copy">
            <p className="brand-main">AlumniConnect</p>
            <p className="brand-sub">Alumni Portal</p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="topbar-search">
            <span className="topbar-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Quick search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="topbar-notification" type="button" aria-label="Notifications">
            🔔
          </button>
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
              <button type="button" className="sidebar-menu-item muted">
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
              <button type="button" className="sidebar-menu-item muted">
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
            <h1>Career Opportunities</h1>
            <p>Welcome back, {displayName}!</p>
          </section>

          <section className="action-strip">
            <div className="action-brand">
              <span className="action-brand-icon">🎓</span>
              <span>AlumniConnect</span>
            </div>
            <button type="button" className="post-btn" onClick={() => setPostModal(true)}>
              + Post Opportunity
            </button>
          </section>

          <section className="stats-grid-alumni">
            <article className="stat-tile">
              <p>Posted Opportunities</p>
              <h3>{summary?.postedOpportunities ?? 0}</h3>
            </article>
            <article className="stat-tile">
              <p>Total Applicants</p>
              <h3>{summary?.totalApplicants ?? 0}</h3>
            </article>
            <article className="stat-tile">
              <p>Pending Mentorship</p>
              <h3>{summary?.pendingRequests ?? 0}</h3>
            </article>
            <article className="stat-tile">
              <p>Approved Mentorship</p>
              <h3>{summary?.approvedMentorships ?? 0}</h3>
            </article>
          </section>

          <section className="search-panel">
            <div className="search-input-wrap">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search by role, company, location, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="chip-row">
              <button
                type="button"
                className={`filter-chip ${activityFilter === "all" ? "active" : ""}`}
                onClick={() => setActivityFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-chip ${activityFilter === "with-applicants" ? "active" : ""}`}
                onClick={() => setActivityFilter("with-applicants")}
              >
                With Applicants
              </button>
              <button
                type="button"
                className={`filter-chip ${activityFilter === "no-applicants" ? "active" : ""}`}
                onClick={() => setActivityFilter("no-applicants")}
              >
                No Applicants
              </button>
              <button
                type="button"
                className={`filter-chip ${activityFilter === "recent" ? "active" : ""}`}
                onClick={() => setActivityFilter("recent")}
              >
                Recent (7d)
              </button>
            </div>

            <div className="chip-row subtle">
              <button
                type="button"
                className={`filter-chip ${typeFilter === "all" ? "active" : ""}`}
                onClick={() => setTypeFilter("all")}
              >
                All Types
              </button>
              <button
                type="button"
                className={`filter-chip ${typeFilter === "internship" ? "active" : ""}`}
                onClick={() => setTypeFilter("internship")}
              >
                Internship
              </button>
              <button
                type="button"
                className={`filter-chip ${typeFilter === "full-time" ? "active" : ""}`}
                onClick={() => setTypeFilter("full-time")}
              >
                Full-time
              </button>
              <button
                type="button"
                className={`filter-chip ${typeFilter === "contract" ? "active" : ""}`}
                onClick={() => setTypeFilter("contract")}
              >
                Contract
              </button>
              <button
                type="button"
                className={`filter-chip ${typeFilter === "hackathon" ? "active" : ""}`}
                onClick={() => setTypeFilter("hackathon")}
              >
                Hackathon
              </button>
              <button
                type="button"
                className={`filter-chip ${modeFilter === "remote" ? "active" : ""}`}
                onClick={() => setModeFilter(modeFilter === "remote" ? "all" : "remote")}
              >
                Remote
              </button>
            </div>
          </section>

          <section className="jobs-list-panel">
            {loading && <p className="state-message">Loading opportunities...</p>}

            {!loading && error && <p className="state-message error">{error}</p>}

            {!loading && !error && filteredOpportunities.length === 0 && (
              <div className="empty-box">
                <p className="empty-title">No jobs found</p>
                <p className="empty-subtitle">No opportunities match your active filters.</p>
                <button type="button" onClick={clearFilters}>
                  Clear all filters
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              filteredOpportunities.map((job) => (
                <article key={job._id} className="job-row-card">
                  <div className="job-row-left">
                    <div className="job-badge-circle">
                      {job.company?.charAt(0)?.toUpperCase() || "J"}
                    </div>
                    <div>
                      <h3>{job.title}</h3>
                      <p className="job-company-copy">{job.company || "Unknown company"}</p>
                      <p className="job-meta-copy">
                        {job.location || "Location not set"} • Posted {formatRelativeDate(job.createdAt)}
                      </p>
                      <div className="tag-list">
                        <span>{formatType(job.type)}</span>
                        <span>{formatType(job.workMode)}</span>
                        <span>{job.applicantsCount || 0} Applicants</span>
                      </div>
                    </div>
                  </div>

                  <div className="job-row-actions">
                    <button type="button" onClick={() => navigate("/my-opportunities")}>Manage</button>
                    <button type="button" className="secondary" onClick={() => navigate("/view-applicants")}>Applicants</button>
                  </div>
                </article>
              ))}
          </section>
        </main>
      </div>

      {/* ── Post Opportunity Modal ── */}
      {postModal && (
        <div className="mopp-modal-backdrop" onClick={() => setPostModal(false)}>
          <div className="mopp-modal mopp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mopp-modal-header">
              <h3>🚀 Post Opportunity</h3>
              <button className="mopp-modal-close" onClick={() => { setPostModal(false); setPostForm(emptyPost); }}>✕</button>
            </div>
            <div className="mopp-modal-body">
              <div className="mopp-field-row">
                <div className="mopp-field">
                  <label>Job Title <span className="mopp-required">*</span></label>
                  <input type="text" value={postForm.title} placeholder="e.g. Frontend Developer"
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} />
                </div>
                <div className="mopp-field">
                  <label>Company <span className="mopp-required">*</span></label>
                  <input type="text" value={postForm.company} placeholder="e.g. TechCorp"
                    onChange={(e) => setPostForm({ ...postForm, company: e.target.value })} />
                </div>
              </div>
              <div className="mopp-field-row">
                <div className="mopp-field">
                  <label>Location</label>
                  <input type="text" value={postForm.location} placeholder="e.g. Bangalore"
                    onChange={(e) => setPostForm({ ...postForm, location: e.target.value })} />
                </div>
                <div className="mopp-field">
                  <label>Salary / Stipend</label>
                  <input type="text" value={postForm.salaryStipend} placeholder="e.g. ₹8 LPA"
                    onChange={(e) => setPostForm({ ...postForm, salaryStipend: e.target.value })} />
                </div>
              </div>
              <div className="mopp-field-row">
                <div className="mopp-field">
                  <label>Job Type</label>
                  <select value={postForm.type} onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}>
                    {["full-time", "internship", "part-time", "contract", "hackathon"].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="mopp-field">
                  <label>Work Mode</label>
                  <select value={postForm.workMode} onChange={(e) => setPostForm({ ...postForm, workMode: e.target.value })}>
                    {["onsite", "remote", "hybrid"].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="mopp-field">
                <label>Job Overview</label>
                <textarea rows={2} value={postForm.overview} placeholder="Brief description of the role..."
                  onChange={(e) => setPostForm({ ...postForm, overview: e.target.value })} />
              </div>
              <div className="mopp-field">
                <label>Responsibilities</label>
                <textarea rows={2} value={postForm.responsibilities} placeholder="Key responsibilities, comma separated..."
                  onChange={(e) => setPostForm({ ...postForm, responsibilities: e.target.value })} />
              </div>
              <div className="mopp-field-row">
                <div className="mopp-field">
                  <label>Required Skills</label>
                  <input type="text" value={postForm.requiredSkills} placeholder="e.g. React, Node.js"
                    onChange={(e) => setPostForm({ ...postForm, requiredSkills: e.target.value })} />
                </div>
                <div className="mopp-field">
                  <label>Preferred Skills</label>
                  <input type="text" value={postForm.preferredSkills} placeholder="e.g. TypeScript, Docker"
                    onChange={(e) => setPostForm({ ...postForm, preferredSkills: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="mopp-modal-footer">
              <button className="mopp-btn-cancel" onClick={() => { setPostModal(false); setPostForm(emptyPost); }}>Cancel</button>
              <button className="mopp-btn-save" onClick={handlePostSubmit} disabled={posting}>{posting ? "Posting…" : "Post Opportunity"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`mopp-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

export default AlumniDashboard;