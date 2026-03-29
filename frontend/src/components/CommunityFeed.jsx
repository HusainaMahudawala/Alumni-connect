
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import NotificationBell from "./NotificationBell";
import ApprovalModal from "./ApprovalModal";
import "../styles/CommunityFeed.css";
import "../pages/StudentDashboard.css";
import "../pages/AlumniDashboard.css";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";
const API_HOST = "http://localhost:5000";

const CommunityFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [showAllPostsModal, setShowAllPostsModal] = useState(false);
  const [joinedUsers, setJoinedUsers] = useState(new Set());
  const [modalPageIndex, setModalPageIndex] = useState(0);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [showAlumniProfileModal, setShowAlumniProfileModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedNotification, setExpandedNotification] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    interests: "",
    skills: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [profileError, setProfileError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const POSTS_PER_PAGE = 1;
  const MODAL_POSTS_PER_PAGE = 10;
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchUserData();
    fetchRecommendedUsers();
    
    // Load joined users from localStorage
    const savedJoinedUsers = localStorage.getItem("joinedUsers");
    if (savedJoinedUsers) {
      try {
        setJoinedUsers(new Set(JSON.parse(savedJoinedUsers)));
      } catch (err) {
        console.error("Failed to load joined users:", err);
      }
    }
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem("pendingChatRecipient");
    if (!pending) return;

    try {
      const recipient = JSON.parse(pending);
      if (recipient && recipient._id) {
        setMessageRecipient(recipient);
        setShowMessageModal(true);
      }
    } catch (err) {
      console.error("Failed to parse pending chat recipient:", err);
    } finally {
      localStorage.removeItem("pendingChatRecipient");
    }
  }, []);

  // Ensure userId is in localStorage whenever userData changes
  useEffect(() => {
    if (userData?._id) {
      localStorage.setItem("userId", userData._id);
      console.log('✅ userData updated, userId in localStorage:', userData._id);
    }
  }, [userData]);

  // Reset expanded notification when notification changes
  useEffect(() => {
    setExpandedNotification(false);
  }, [notification]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
      
      // Extract top contributors from posts
      const authors = res.data.reduce((acc, post) => {
        const existing = acc.find(a => a.name === post.authorName);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ name: post.authorName, count: 1 });
        }
        return acc;
      }, []);
      
      const top = authors
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(a => a.name);
      setTopContributors(top);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      
      // Determine the correct endpoint based on user role
      const endpoint = userRole === "alumni" 
        ? "http://localhost:5000/api/alumni/me"
        : "http://localhost:5000/api/dashboard/student";
      
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalizedData = userRole === "alumni" ? (res.data?.data || null) : (res.data || null);
      console.log("✅ fetchUserData response:", normalizedData);
      setUserData(normalizedData);

      if (normalizedData?._id) {
        localStorage.setItem("userId", normalizedData._id);
        console.log("✅ userId saved to localStorage:", normalizedData._id);
      }
    } catch (error) {
      console.error('❌ fetchUserData error:', error.response?.data || error.message);
      setUserData(null);
    }
  };

  const fetchRecommendedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch recommended alumni based on student interests
      const res = await axios.get("http://localhost:5000/api/users/alumni/recommended", {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        return { data: [] };
      });
      
      if (res.data && res.data.length > 0) {
        setRecommendedUsers(res.data);
      } else {
        // Fallback with enhanced seed data
        setRecommendedUsers([
          { _id: "1", name: "Sarah Johnson", email: "sarah.johnson@alumni.com", role: "alumni", company: "Google", experience: 5 },
          { _id: "2", name: "Michael Chen", email: "michael.chen@alumni.com", role: "alumni", company: "Microsoft", experience: 7 },
          { _id: "3", name: "Emma Rodriguez", email: "emma.rodriguez@alumni.com", role: "alumni", company: "Amazon", experience: 4 },
          { _id: "4", name: "James Watson", email: "james.watson@alumni.com", role: "mentor", company: "Meta", experience: 8 },
          { _id: "5", name: "Lisa Anderson", email: "lisa.anderson@alumni.com", role: "alumni", company: "Apple", experience: 6 },
        ]);
      }
    } catch {
      setRecommendedUsers([
        { _id: "1", name: "Sarah Johnson", email: "sarah.johnson@alumni.com", role: "alumni", company: "Google", experience: 5 },
        { _id: "2", name: "Michael Chen", email: "michael.chen@alumni.com", role: "alumni", company: "Microsoft", experience: 7 },
        { _id: "3", name: "Emma Rodriguez", email: "emma.rodriguez@alumni.com", role: "alumni", company: "Amazon", experience: 4 },
        { _id: "4", name: "James Watson", email: "james.watson@alumni.com", role: "mentor", company: "Meta", experience: 8 },
        { _id: "5", name: "Lisa Anderson", email: "lisa.anderson@alumni.com", role: "alumni", company: "Apple", experience: 6 },
      ]);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleJoinUser = async (userId) => {
    const newJoinedUsers = new Set(joinedUsers);
    const isAlreadyJoined = newJoinedUsers.has(userId);

    try {
      const token = localStorage.getItem("token");
      
      if (isAlreadyJoined) {
        // Unfollow
        await axios.post(
          `http://localhost:5000/api/users/${userId}/unfollow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        newJoinedUsers.delete(userId);
        setNotification({ type: 'success', message: 'Successfully unfollowed alumni' });
      } else {
        // Follow
        await axios.post(
          `http://localhost:5000/api/users/${userId}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        newJoinedUsers.add(userId);
        
        // Get alumni name for notification
        const alumni = recommendedUsers.find(u => u._id === userId);
        const alumniName = alumni?.name || 'Alumni';
        
        setNotification({ 
          type: 'success', 
          message: `🎉 Connected with ${alumniName}! You can now message and request mentorship.` 
        });
      }
      
      setJoinedUsers(newJoinedUsers);
      localStorage.setItem("joinedUsers", JSON.stringify([...newJoinedUsers]));
      
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error("Error joining/leaving alumni:", err);
      setNotification({ type: 'error', message: 'Failed to update connection. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleViewAlumniProfile = (alumni) => {
    setSelectedAlumni(alumni);
    setShowAlumniProfileModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      setNotification({ type: 'error', message: 'Message cannot be empty' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!messageRecipient || !messageRecipient._id) {
      setNotification({ type: 'error', message: 'Recipient information missing' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setNotification({ type: 'error', message: 'Authentication token missing. Please login again.' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/messages/send`,
        { 
          recipientId: messageRecipient._id,
          content: messageText 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("Message sent successfully:", response.data);
      
      setNotification({ 
        type: 'success', 
        message: `💬 Message sent to ${messageRecipient.name}!` 
      });
      setMessageText("");
      setMessageRecipient(null);
      setShowMessageModal(false);
      setShowAlumniProfileModal(false);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Error sending message:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to send message. Please try again.';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleRequestMentorship = async (alumniId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/mentorship/request`,
        { 
          alumniId: alumniId,
          purpose: "I would like to request mentorship." 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Mentorship request sent successfully:", response.data);
      setNotification({ 
        type: 'success', 
        message: '✉️ Mentorship request sent! They will review and respond.' 
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error("Error requesting mentorship:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to send mentorship request.';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleLike = async (postId) => {
    await fetchPosts();
  };

  const handleComment = async (postId, newComment) => {
    await fetchPosts();
  };

  // Get current user ID from either userData or localStorage
  const currentUserId = userData?._id || localStorage.getItem("userId");
  const userRole = localStorage.getItem("role");
  const isAlumni = userRole === "alumni";
  const dashboardPath = isAlumni ? "/alumni-dashboard" : "/student";
  const displayName = userData?.name || storedUser?.name || "Alumni";
  const displayEmail = userData?.email || storedUser?.email || "alumni@portal.com";
  const alumniProfilePicture = userData?.profilePicture || storedUser?.profilePicture;
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const openProfileModal = async () => {
    setProfileModal(true);
    setProfileLoading(true);
    setProfileError("");
    setProfileImageFile(null);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/users/me/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profile = res.data || {};
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        interests: Array.isArray(profile.interests) ? profile.interests.join(", ") : "",
        skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : ""
      });

      if (profile.profilePicture) {
        setProfileImagePreview(
          profile.profilePicture.startsWith("http")
            ? profile.profilePicture
            : `${API_HOST}${profile.profilePicture}`
        );
      } else {
        setProfileImagePreview("");
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfileField = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleProfileImageUpload = async () => {
    if (!profileImageFile) {
      setNotification({ type: "error", message: "Please choose an image first." });
      return;
    }

    setProfileUploading(true);
    setProfileError("");

    try {
      const token = localStorage.getItem("token");
      const body = new FormData();
      body.append("profilePicture", profileImageFile);

      const res = await axios.post(`${API_BASE}/users/me/student/profile-picture`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      const uploadedPath = res.data?.profilePicture || "";
      if (uploadedPath) {
        const finalUrl = uploadedPath.startsWith("http") ? uploadedPath : `${API_HOST}${uploadedPath}`;
        setProfileImagePreview(finalUrl);
        setUserData((prev) => (prev ? { ...prev, profilePicture: uploadedPath } : prev));
      }

      setProfileImageFile(null);
      setNotification({ type: "success", message: "Profile image uploaded." });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload image";
      setProfileError(msg);
      setNotification({ type: "error", message: msg });
    } finally {
      setProfileUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/users/me/student`,
        {
          ...profileForm,
          interests: profileForm.interests,
          skills: profileForm.skills
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data?.data) {
        const updated = res.data.data;
        setUserData((prev) => ({ ...(prev || {}), name: updated.name, email: updated.email }));
      }

      setNotification({ type: "success", message: "Profile updated successfully." });
      setProfileModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setProfileError(msg);
      setNotification({ type: "error", message: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const sortedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    const copy = [...posts];
    const safeLikes = (p) => Number(p.likes || 0);
    const safeComments = (p) => (Array.isArray(p.comments) ? p.comments.length : 0);
    if (activeTab === "popular") {
      copy.sort((a, b) => safeLikes(b) - safeLikes(a));
    } else if (activeTab === "trending") {
      copy.sort((a, b) => safeComments(b) - safeComments(a));
    } else if (activeTab === "following") {
      const currentName = userData?.name;
      return copy.filter((p) => currentName && p.authorName === currentName);
    } else {
      // "All" – newest first
      copy.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }
    return copy;
  }, [posts, activeTab, userData?.name]);

  const filteredPosts = useMemo(() => {
    const base = sortedPosts;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return (base || []).filter((p) => {
      const hay = [
        p?.content,
        p?.authorName,
        p?.authorRole,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sortedPosts, search]);

  return (
    <div className="dashboard cf-dashboard">
      {/* Notification Toast */}
      {notification && (
        <div 
          className={`notification-toast notification-${notification.type} ${expandedNotification ? 'expanded' : ''}`}
          onClick={() => setExpandedNotification(!expandedNotification)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setExpandedNotification(!expandedNotification)}
        >
          <p>{notification.message}</p>
          <button 
            className="notification-close" 
            onClick={(e) => {
              e.stopPropagation();
              setNotification(null);
              setExpandedNotification(false);
            }}
            type="button"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {isAlumni ? (
        <header className="alumni-topbar">
          <div className="topbar-brand" onClick={() => handleNavigation(dashboardPath)} role="button" tabIndex={0}>
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
            <NotificationBell
              onApproveClick={(notificationItem) => {
                setSelectedNotification(notificationItem);
                setShowApprovalModal(true);
              }}
            />
          </div>
        </header>
      ) : (
        <nav className="dashboard-navbar">
          <div className="navbar-left">
            <div className="navbar-logo" onClick={() => handleNavigation(dashboardPath)} role="button" tabIndex={0}>
              <span className="logo-icon">🎓</span>
              <div className="logo-text">
                <div className="logo-main">AlumniConnect</div>
                <div className="logo-sub">Student Portal</div>
              </div>
            </div>
          </div>
          <div className="navbar-right">
            <div className="search-bar cf-top-search">
              <input
                type="text"
                placeholder="Search posts, people, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="notification-btn" type="button" aria-label="Notifications">
              🔔
            </button>
          </div>
        </nav>
      )}

      <div className={isAlumni ? "alumni-shell" : "main-container"}>
        {isAlumni ? (
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
                {alumniProfilePicture ? (
                  <img
                    src={alumniProfilePicture.startsWith("http") ? alumniProfilePicture : `http://localhost:5000${alumniProfilePicture}`}
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
        ) : (
          <aside className="sidebar">
            <div className="sidebar-content">
              <div className="menu-section">
                <h4 className="menu-title">MAIN MENU</h4>
                <nav className="menu-list">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation("/student");
                    }}
                    className={`menu-item ${location.pathname === "/student" ? "active" : ""}`}
                  >
                    <span className="menu-icon">📊</span>
                    <span>Dashboard</span>
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation("/opportunity");
                    }}
                    className={`menu-item ${location.pathname === "/opportunity" ? "active" : ""}`}
                  >
                    <span className="menu-icon">💼</span>
                    <span>Opportunities</span>
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation("/mentorship");
                    }}
                    className={`menu-item ${location.pathname === "/mentorship" ? "active" : ""}`}
                  >
                    <span className="menu-icon">🤝</span>
                    <span>Mentorship</span>
                  </a>
                  <a href="#" className="menu-item" onClick={(e) => e.preventDefault()}>
                    <span className="menu-icon">📅</span>
                    <span>Events</span>
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation("/community");
                    }}
                    className={`menu-item ${location.pathname === "/community" ? "active" : ""}`}
                  >
                    <span className="menu-icon">💬</span>
                    <span>Community Feed</span>
                  </a>
                </nav>
              </div>
            </div>

            <div className="sidebar-footer">
              <div
                className="user-profile student-profile-click"
                role="button"
                tabIndex={0}
                title="Edit Profile"
                onClick={openProfileModal}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProfileModal();
                  }
                }}
              >
                <div className="user-avatar">
                  {userData?.profilePicture ? (
                    <img
                      src={userData.profilePicture.startsWith("http") ? userData.profilePicture : `${API_HOST}${userData.profilePicture}`}
                      alt="Profile"
                      className="user-avatar-img"
                    />
                  ) : (
                    userData?.name?.charAt(0)?.toUpperCase() || "S"
                  )}
                </div>
                <div className="user-info">
                  <p className="user-name">{userData?.name || "Student"}</p>
                  <p className="user-role">Student Account</p>
                </div>
                <button className="user-menu-btn" type="button" aria-label="User menu">
                  ⋮
                </button>
              </div>
              <button className="logout-btn" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </aside>
        )}

        <section className="dashboard-content cf-content">
          <div className="cf-hero">
            <div className="cf-hero-copy">
              <h1 className="cf-title">Community Feed</h1>
              <p className="cf-subtitle">
                Share updates, ask questions, and connect with alumni & peers.
              </p>
              <div className="cf-tabs">
                <button
                  className={`cf-tab ${activeTab === "all" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button
                  className={`cf-tab ${activeTab === "popular" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab("popular")}
                >
                  Popular
                </button>
                <button
                  className={`cf-tab ${activeTab === "trending" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab("trending")}
                >
                  Trending
                </button>
                <button
                  className={`cf-tab ${activeTab === "following" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab("following")}
                >
                  My Posts
                </button>
              </div>
            </div>
            <div className="cf-hero-glass" aria-hidden="true" />
          </div>

          <div className="cf-grid">
            <aside className="cf-left">
              <div className="cf-card">
                <div className="cf-card-head">
                  <p className="cf-card-title">Top Contributors</p>
                </div>
                <div className="cf-contrib">
                  {topContributors.length > 0 ? (
                    topContributors.map((n) => (
                      <div key={n} className="cf-contrib-item">
                        <div className="cf-contrib-avatar" aria-hidden="true" />
                        <p className="cf-contrib-name">{n}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'rgba(100, 116, 139, 0.9)', fontSize: '12px', gridColumn: '1 / -1' }}>No posts yet</p>
                  )}
                </div>
              </div>

              <div className="cf-card">
                <p className="cf-card-title">Explore Communities</p>
                <div className="cf-community-list">
                  {[
                    "Frontend Developers",
                    "UI/UX Designers",
                    "Tech Internships",
                  ].map((c) => (
                    <button key={c} className="cf-row-btn" type="button">
                      <span className="cf-row-icon">👥</span>
                      <span className="cf-row-text">{c}</span>
                      <span className="cf-row-chev">›</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <main className="cf-center">
              <CreatePost onPostCreated={handlePostCreated} />

              {loading ? (
                <div className="cf-empty">
                  <div className="cf-empty-blob" />
                  <p>Loading posts...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="cf-empty">
                  <div className="cf-empty-blob" />
                  <p>No posts found. Try a different search.</p>
                </div>
              ) : (
                <>
                  <div className="feed-posts-list cf-posts">
                    {filteredPosts.slice(0, POSTS_PER_PAGE).map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        userId={currentUserId}
                      />
                    ))}
                  </div>
                  
                  {filteredPosts.length > POSTS_PER_PAGE && (
                    <button
                      className="view-all-posts-btn"
                      type="button"
                      onClick={() => setShowAllPostsModal(true)}
                    >
                      View All ({filteredPosts.length} posts)
                    </button>
                  )}
                </>
              )}
            </main>

            <aside className="cf-right">
              <div className="cf-card">
                <div className="cf-card-head">
                  <p className="cf-card-title">Recommended for You</p>
                  <button className="cf-icon-btn" type="button" aria-label="Help">
                    ?
                  </button>
                </div>
                <div className="cf-reco-list">
                  {recommendedUsers.length > 0 ? (
                    recommendedUsers.map((u) => (
                      <div key={u._id || u.name || u.email} className="cf-reco-item">
                        <button
                          className="cf-reco-avatar-btn"
                          onClick={() => handleViewAlumniProfile(u)}
                          type="button"
                        >
                          <div className="cf-reco-avatar" aria-hidden="true">{u.name?.charAt(0) || "U"}</div>
                        </button>
                        <div className="cf-reco-body">
                          <button
                            className="cf-reco-body-btn"
                            onClick={() => handleViewAlumniProfile(u)}
                            type="button"
                          >
                            <p className="cf-reco-name">{u.name || "User"}</p>
                            <p className="cf-reco-meta">
                              {u.company || "Professional"} 
                              {u.experience ? ` • ${u.experience} yrs` : ''}
                            </p>
                          </button>
                        </div>
                        <button
                          className={`cf-join-btn ${joinedUsers.has(u._id) ? 'joined' : ''}`}
                          type="button"
                          onClick={() => handleJoinUser(u._id, u.name)}
                        >
                          {joinedUsers.has(u._id) ? '✓ Joined' : '+ Join'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'rgba(100, 116, 139, 0.9)', fontSize: '12px' }}>Loading recommendations...</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {/* View All Posts Modal */}
      {showAllPostsModal && (
        <div
          className="view-all-posts-modal-bg"
          onClick={() => {
            setShowAllPostsModal(false);
            setModalPageIndex(0);
          }}
        >
          <div
            className="view-all-posts-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">All Posts ({filteredPosts.length})</h2>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => {
                  setShowAllPostsModal(false);
                  setModalPageIndex(0);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-posts-container">
              {filteredPosts
                .slice(
                  modalPageIndex * MODAL_POSTS_PER_PAGE,
                  (modalPageIndex + 1) * MODAL_POSTS_PER_PAGE
                )
                .map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    userId={currentUserId}
                  />
                ))}
            </div>

            <div className="modal-pagination">
              <button
                className="pagination-btn"
                type="button"
                onClick={() => setModalPageIndex(Math.max(0, modalPageIndex - 1))}
                disabled={modalPageIndex === 0}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {modalPageIndex + 1} of{" "}
                {Math.ceil(filteredPosts.length / MODAL_POSTS_PER_PAGE)}
              </span>
              <button
                className="pagination-btn"
                type="button"
                onClick={() =>
                  setModalPageIndex(
                    Math.min(
                      Math.ceil(filteredPosts.length / MODAL_POSTS_PER_PAGE) - 1,
                      modalPageIndex + 1
                    )
                  )
                }
                disabled={
                  (modalPageIndex + 1) *
                    MODAL_POSTS_PER_PAGE >=
                  filteredPosts.length
                }
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Profile Modal */}
      {showAlumniProfileModal && selectedAlumni && (
        <div
          className="alumni-profile-modal-bg"
          onClick={() => setShowAlumniProfileModal(false)}
        >
          <div
            className="alumni-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              type="button"
              onClick={() => setShowAlumniProfileModal(false)}
            >
              ✕
            </button>

            <div className="alumni-profile-header">
              <div className="alumni-profile-avatar">
                {selectedAlumni.name?.charAt(0) || "U"}
              </div>
              <div className="alumni-profile-info">
                <h2 className="alumni-name">{selectedAlumni.name}</h2>
                <p className="alumni-company">{selectedAlumni.company || "Professional"}</p>
                {selectedAlumni.experience && (
                  <p className="alumni-experience">
                    💼 {selectedAlumni.experience} years of experience
                  </p>
                )}
                {!selectedAlumni.experience && (
                  <p className="alumni-experience">0</p>
                )}
              </div>
            </div>

            <div className="alumni-profile-actions">
              <button
                className="action-btn message-btn"
                type="button"
                onClick={() => {
                  setMessageRecipient(selectedAlumni);
                  setShowMessageModal(true);
                }}
              >
                💬 Send Message
              </button>
              <button
                className="action-btn mentor-btn"
                type="button"
                onClick={() => {
                  handleRequestMentorship(selectedAlumni._id);
                  setShowAlumniProfileModal(false);
                }}
              >
                🎓 Request Mentorship
              </button>
              <button
                className={`action-btn join-btn ${joinedUsers.has(selectedAlumni._id) ? 'joined' : ''}`}
                type="button"
                onClick={() => {
                  handleJoinUser(selectedAlumni._id, selectedAlumni.name);
                  setShowAlumniProfileModal(false);
                }}
              >
                {joinedUsers.has(selectedAlumni._id) ? '✓ Disconnect' : '+ Connect'}
              </button>
            </div>

            <div className="alumni-profile-bio">
              <p className="bio-title">About</p>
              <p className="bio-text">
                {selectedAlumni.company ? 
                  `Working at ${selectedAlumni.company}${selectedAlumni.experience ? ` with ${selectedAlumni.experience} years of professional experience` : ''}.` 
                  : 'Alumni of our community.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && messageRecipient && (
        <div
          className="message-modal-bg"
          onClick={() => setShowMessageModal(false)}
        >
          <div
            className="message-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              type="button"
              onClick={() => setShowMessageModal(false)}
            >
              ✕
            </button>

            <div className="message-modal-header">
              <h2>Message to {messageRecipient.name}</h2>
              <p className="message-recipient-role">{messageRecipient.company || "Professional"}</p>
            </div>

            <textarea
              className="message-input"
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows="6"
            />

            <div className="message-modal-actions">
              <button
                className="cancel-btn"
                type="button"
                onClick={() => setShowMessageModal(false)}
              >
                Cancel
              </button>
              <button
                className="send-btn"
                type="button"
                onClick={handleSendMessage}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {profileModal && (
        <div className="sd-modal-backdrop" onClick={() => setProfileModal(false)}>
          <div className="sd-modal sd-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>👤 Edit Profile</h3>
              <button className="sd-modal-close" onClick={() => setProfileModal(false)}>✕</button>
            </div>

            <div className="sd-modal-body">
              {profileLoading && <p className="sd-modal-state">Loading your profile...</p>}

              {!profileLoading && (
                <>
                  <div className="sd-profile-image-block">
                    <div className="sd-profile-image-preview">
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Student profile preview" />
                      ) : (
                        <div className="sd-profile-image-fallback">{(profileForm.name || "S").charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <div className="sd-profile-image-actions">
                      <input type="file" accept="image/*" onChange={handleProfileImageSelect} />
                      <button className="sd-modal-btn" type="button" onClick={handleProfileImageUpload} disabled={profileUploading}>
                        {profileUploading ? "Uploading..." : "Upload Image"}
                      </button>
                    </div>
                  </div>

                  {profileError && <p className="sd-profile-error">{profileError}</p>}

                  <form className="sd-profile-form" onSubmit={saveProfile}>
                    <label htmlFor="cf-profile-name">Name</label>
                    <input
                      id="cf-profile-name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => updateProfileField("name", e.target.value)}
                      required
                    />

                    <label htmlFor="cf-profile-email">Email</label>
                    <input
                      id="cf-profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => updateProfileField("email", e.target.value)}
                      required
                    />

                    <label htmlFor="cf-profile-phone">Phone</label>
                    <input
                      id="cf-profile-phone"
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => updateProfileField("phone", e.target.value)}
                      required
                    />

                    <label htmlFor="cf-profile-interests">Interests (comma separated)</label>
                    <textarea
                      id="cf-profile-interests"
                      rows={2}
                      value={profileForm.interests}
                      onChange={(e) => updateProfileField("interests", e.target.value)}
                      placeholder="AI, Backend, Product"
                    />

                    <label htmlFor="cf-profile-skills">Skills (comma separated)</label>
                    <textarea
                      id="cf-profile-skills"
                      rows={2}
                      value={profileForm.skills}
                      onChange={(e) => updateProfileField("skills", e.target.value)}
                      placeholder="React, Node.js, SQL"
                    />

                    <div className="sd-profile-actions">
                      <button className="sd-profile-cancel" type="button" onClick={() => setProfileModal(false)}>
                        Cancel
                      </button>
                      <button className="sd-modal-btn" type="submit" disabled={profileSaving}>
                        {profileSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && selectedNotification && (
        <ApprovalModal
          notification={selectedNotification}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedNotification(null);
          }}
          onApproveSuccess={() => {
            setShowApprovalModal(false);
            setSelectedNotification(null);
          }}
        />
      )}
    </div>
  );
};

export default CommunityFeed;
