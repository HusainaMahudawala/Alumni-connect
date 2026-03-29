import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./MyOpportunities.css";

const API = "http://localhost:5000/api/opportunity";
const API_BASE = "http://localhost:5000/api";

function MyOpportunities() {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [alumniProfile, setAlumniProfile] = useState(null);
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const [deleteId, setDeleteId] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const emptyPost = { title: "", company: "", location: "", type: "full-time", workMode: "onsite", salaryStipend: "", overview: "", responsibilities: "", requiredSkills: "", preferredSkills: "" };
  const [postModal, setPostModal] = useState(false);
  const [postForm, setPostForm] = useState(emptyPost);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetchJobs();
      await fetchAlumniProfile();
    };
    loadData();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchJobs = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API}/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setJobs(res.data);
  };

  const fetchAlumniProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/alumni/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlumniProfile(response.data.data);
    } catch (error) {
      console.error("Error fetching alumni profile:", error);
    }
  };

  const openEdit = (job) => {
    setEditJob(job);
    setEditForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salaryStipend: job.salaryStipend || "",
      type: job.type || "full-time",
      workMode: job.workMode || "onsite",
    });
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/${editJob._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditJob(null);
      fetchJobs();
      showToast("Opportunity updated successfully!");
    } catch {
      showToast("Failed to update opportunity.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      fetchJobs();
      showToast("Opportunity deleted.");
    } catch {
      showToast("Failed to delete opportunity.", "error");
    }
  };

  const handlePostSubmit = async () => {
    if (!postForm.title.trim() || !postForm.company.trim()) {
      showToast("Job title and company are required.", "error");
      return;
    }
    setPosting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(API, postForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostModal(false);
      setPostForm(emptyPost);
      fetchJobs();
      showToast("Opportunity submitted and is pending admin approval.");
    } catch {
      showToast("Failed to post opportunity.", "error");
    } finally {
      setPosting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const displayName = storedUser?.name || "Alumni";
  const displayEmail = storedUser?.email || "alumni@portal.com";

  const normalizeStatus = (status) => {
    const safe = (status || "pending").toLowerCase();
    if (["pending", "approved", "rejected"].includes(safe)) return safe;
    return "pending";
  };

  const statusLabel = (status) => {
    const safe = normalizeStatus(status);
    return safe.charAt(0).toUpperCase() + safe.slice(1);
  };

  return (
    <div className="myopp-dashboard">
      <header className="myopp-topbar">
        <div className="myopp-brand" onClick={() => navigate("/alumni-dashboard")} role="button" tabIndex={0}>
          <div className="myopp-brand-icon">🎓</div>
          <div>
            <p className="myopp-brand-main">AlumniConnect</p>
            <p className="myopp-brand-sub">Alumni Portal</p>
          </div>
        </div>

        <button type="button" className="myopp-post-btn" onClick={() => setPostModal(true)}>
          + Post Opportunity
        </button>
      </header>

      <div className="myopp-shell">
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
                className="sidebar-menu-item"
              >
                <span>👥</span>
                Alumni Directory
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-opportunities")}
                className={`sidebar-menu-item ${location.pathname === "/my-opportunities" ? "active" : ""}`}
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
                className={`sidebar-menu-item ${location.pathname === "/mentorship-requests" ? "active" : ""}`}
              >
                <span>🤝</span>
                Mentorship
              </button>
            </nav>
          </div>

          <div
            className="sidebar-profile"
            role="button"
            tabIndex={0}
            title="Edit Profile"
            onClick={() => navigate("/alumni-profile/edit")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/alumni-profile/edit");
              }
            }}
          >
            <div className="profile-avatar">
              {alumniProfile?.profilePicture || storedUser?.profilePicture ? (
                <img
                  src={(alumniProfile?.profilePicture || storedUser?.profilePicture).startsWith("http") ? (alumniProfile?.profilePicture || storedUser?.profilePicture) : `http://localhost:5000${alumniProfile?.profilePicture || storedUser?.profilePicture}`}
                  alt="Profile"
                  className="profile-avatar-img"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
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

        <main className="myopp-main">
          <section className="my-opportunities-page">
            <div className="my-opportunities-header">
              <div>
                <h2>My Posted Opportunities</h2>
                <p>Track all opportunities you have shared with students.</p>
              </div>
              <span className="opportunity-count">{jobs.length} Total</span>
            </div>

            {jobs.length === 0 ? (
              <div className="my-opportunities-empty">
                <div className="empty-opp-icon">📋</div>
                <h3>No opportunities posted yet</h3>
                <p>Once you post an opportunity, it will appear here.</p>
                <button className="myopp-post-btn" onClick={() => setPostModal(true)}>+ Post your first opportunity</button>
              </div>
            ) : (
              <div className="my-opportunities-list">
                {jobs.map((job) => (
                  <article key={job._id} className="my-opportunity-card">
                    <div className="mopp-card-left">
                      <div className="mopp-card-avatar">{job.company?.charAt(0).toUpperCase() || "J"}</div>
                      <div className="mopp-card-body">
                        <div className="mopp-title-row">
                          <h3>{job.title}</h3>
                          <span className={`mopp-status-badge ${normalizeStatus(job.status)}`}>
                            {statusLabel(job.status)}
                          </span>
                        </div>
                        <p className="mopp-company">{job.company}</p>
                        <div className="mopp-tags">
                          {job.location && <span className="mopp-tag">📍 {job.location}</span>}
                          {job.type && <span className="mopp-tag">{job.type}</span>}
                          {job.workMode && <span className="mopp-tag">{job.workMode}</span>}
                        </div>
                        <div className="mopp-meta">
                          <span>💰 {job.salaryStipend || "Not specified"}</span>
                          <span className="mopp-meta-divider">·</span>
                          <span>👥 {job.applicants?.length || 0} applicant{job.applicants?.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mopp-card-actions">
                      <button className="mopp-btn-edit" onClick={() => openEdit(job)}>✏️ Edit</button>
                      <button className="mopp-btn-delete" onClick={() => setDeleteId(job._id)}>🗑 Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
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

      {/* ── Edit Modal ── */}
      {editJob && (
        <div className="mopp-modal-backdrop" onClick={() => setEditJob(null)}>
          <div className="mopp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mopp-modal-header">
              <h3>Edit Opportunity</h3>
              <button className="mopp-modal-close" onClick={() => setEditJob(null)}>✕</button>
            </div>
            <div className="mopp-modal-body">
              {[["title", "Job Title", "text"], ["company", "Company", "text"], ["location", "Location", "text"], ["salaryStipend", "Salary / Stipend", "text"]].map(([field, label]) => (
                <div className="mopp-field" key={field}>
                  <label>{label}</label>
                  <input
                    type="text"
                    value={editForm[field]}
                    onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                    placeholder={label}
                  />
                </div>
              ))}
              <div className="mopp-field-row">
                <div className="mopp-field">
                  <label>Type</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                    {["full-time", "internship", "part-time", "contract", "hackathon"].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="mopp-field">
                  <label>Work Mode</label>
                  <select value={editForm.workMode} onChange={(e) => setEditForm({ ...editForm, workMode: e.target.value })}>
                    {["onsite", "remote", "hybrid"].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="mopp-modal-footer">
              <button className="mopp-btn-cancel" onClick={() => setEditJob(null)}>Cancel</button>
              <button className="mopp-btn-save" onClick={handleEditSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="mopp-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="mopp-modal mopp-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mopp-modal-header">
              <h3>Delete Opportunity</h3>
              <button className="mopp-modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="mopp-modal-body">
              <p>Are you sure you want to delete this opportunity? This action cannot be undone.</p>
            </div>
            <div className="mopp-modal-footer">
              <button className="mopp-btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="mopp-btn-delete-confirm" onClick={handleDelete}>Yes, Delete</button>
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

export default MyOpportunities;