import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AlumniDashboard.css";
import "./EditAlumniProfile.css";

const API_BASE = "http://localhost:5000/api";
const API_HOST = "http://localhost:5000";

const emptyForm = {
  name: "",
  email: "",
  profilePicture: "",
  graduationYear: "",
  degree: "",
  currentCompany: "",
  jobTitle: "",
  industry: "",
  location: "",
  skills: "",
  linkedin: "",
  bio: "",
  careerJourney: "",
  experience: ""
};

function EditAlumniProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/alumni/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const profile = res.data || {};

        setForm({
          name: profile.name || "",
          email: profile.email || "",
          profilePicture: profile.profilePicture || "",
          graduationYear: profile.graduationYear || "",
          degree: profile.degree || "",
          currentCompany: profile.currentCompany || "",
          jobTitle: profile.jobTitle || "",
          industry: profile.industry || "",
          location: profile.location || "",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
          linkedin: profile.linkedin || "",
          bio: profile.bio || "",
          careerJourney: profile.careerJourney || "",
          experience: profile.experience || ""
        });

        if (profile.profilePicture) {
          setImagePreview(
            profile.profilePicture.startsWith("http")
              ? profile.profilePicture
              : `${API_HOST}${profile.profilePicture}`
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const displayName = storedUser?.name || "Alumni";
  const displayEmail = storedUser?.email || "alumni@portal.com";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      showToast("Please select an image file first.", "error");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const body = new FormData();
      body.append("profilePicture", imageFile);

      const res = await axios.post(`${API_BASE}/alumni/me/profile-picture`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      const uploadedPath = res.data?.profilePicture || "";
      setForm((prev) => ({ ...prev, profilePicture: uploadedPath }));
      if (uploadedPath) {
        setImagePreview(
          uploadedPath.startsWith("http") ? uploadedPath : `${API_HOST}${uploadedPath}`
        );
        // Update localStorage with new profile picture
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            profilePicture: uploadedPath
          })
        );
      }
      setImageFile(null);
      showToast("Profile picture uploaded.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to upload profile picture";
      setError(message);
      showToast(message, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...form,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      };

      const res = await axios.put(`${API_BASE}/alumni/me`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.data?.name) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            name: res.data.data.name,
            email: res.data.data.email,
            profilePicture: res.data.data.profilePicture || form.profilePicture
          })
        );
      }

      showToast("Profile updated successfully.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="alumni-jobs-dashboard">
      <header className="alumni-topbar">
        <div className="topbar-brand">
          <div className="brand-icon">AL</div>
          <div className="brand-copy">
            <p className="brand-main">AlumniConnect</p>
            <p className="brand-sub">Edit Alumni Profile</p>
          </div>
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
                className="sidebar-menu-item"
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
              {form.profilePicture ? (
                <img
                  src={form.profilePicture.startsWith("http") ? form.profilePicture : `http://localhost:5000${form.profilePicture}`}
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

        <main className="alumni-main">
          {loading && (
            <section className="edit-profile-state">
              <div className="spinner" />
              <p>Loading your profile...</p>
            </section>
          )}

          {!loading && error && <p className="edit-profile-error">{error}</p>}

          {!loading && (
            <section className="edit-profile-card">
              <h1>Edit Alumni Profile</h1>
              <p className="edit-profile-subtitle">Keep your directory details up to date so others can find and connect with you.</p>

              <form className="edit-profile-form" onSubmit={handleSubmit}>
                <section className="profile-image-panel">
                  <p className="profile-image-label">Profile Picture</p>
                  <p className="profile-image-hint">Upload a JPG, PNG, GIF, SVG, or WEBP image.</p>
                  <div className="profile-image-row">
                    <div className="profile-image-preview">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile preview" />
                      ) : (
                        <div className="profile-image-fallback">
                          {(form.name || "A").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="profile-image-actions">
                      <input
                        id="profile-photo-input"
                        className="profile-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelection}
                      />
                      <label htmlFor="profile-photo-input" className="choose-photo-btn">
                        Choose Photo
                      </label>
                      <span className="selected-file-name">
                        {imageFile ? imageFile.name : "No file chosen"}
                      </span>
                      <button
                        type="button"
                        className="upload-photo-btn"
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? "Uploading..." : "Upload Photo"}
                      </button>
                    </div>
                  </div>
                </section>

                <div className="edit-profile-grid">
                  <label>
                    Full Name
                    <input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                  </label>

                  <label>
                    Email
                    <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                  </label>

                  <label>
                    Graduation Year
                    <input
                      type="number"
                      min="1950"
                      max="2100"
                      value={form.graduationYear}
                      onChange={(e) => updateField("graduationYear", e.target.value)}
                    />
                  </label>

                  <label>
                    Degree
                    <input value={form.degree} onChange={(e) => updateField("degree", e.target.value)} />
                  </label>

                  <label>
                    Current Company
                    <input value={form.currentCompany} onChange={(e) => updateField("currentCompany", e.target.value)} />
                  </label>

                  <label>
                    Job Title
                    <input value={form.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} />
                  </label>

                  <label>
                    Industry
                    <input value={form.industry} onChange={(e) => updateField("industry", e.target.value)} />
                  </label>

                  <label>
                    Location
                    <input value={form.location} onChange={(e) => updateField("location", e.target.value)} />
                  </label>

                  <label>
                    Skills (comma-separated)
                    <input value={form.skills} onChange={(e) => updateField("skills", e.target.value)} />
                  </label>

                  <label>
                    LinkedIn URL
                    <input value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
                  </label>

                  <label>
                    Experience
                    <input value={form.experience} onChange={(e) => updateField("experience", e.target.value)} />
                  </label>
                </div>

                <label>
                  Bio
                  <textarea rows={4} value={form.bio} onChange={(e) => updateField("bio", e.target.value)} />
                </label>

                <label>
                  Career Journey
                  <textarea rows={4} value={form.careerJourney} onChange={(e) => updateField("careerJourney", e.target.value)} />
                </label>

                <div className="edit-profile-actions">
                  <button type="button" onClick={() => navigate("/alumni-directory")}>Back to Directory</button>
                  <button type="submit" className="primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>

      {toast && <div className={`directory-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default EditAlumniProfile;
