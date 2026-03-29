import { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import CommunityFeed from "./components/CommunityFeed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentOpportunities from "./pages/StudentOpportunities";
import Mentorship from "./pages/Mentorship";
import AlumniDashboard from "./pages/AlumniDashboard";
import LandingPage from "./pages/LandingPage";
import PostOpportunity from "./pages/PostOpportunity";
import MyOpportunities from "./pages/MyOpportunities";
import ViewApplicants from "./pages/ViewApplicants";
import MentorshipRequests from "./pages/MentorshipRequests";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ManageOpportunities from "./pages/ManageOpportunities";
import ManageUsers from "./pages/ManageUsers";
import AdminMentorshipRequests from "./pages/AdminMentorshipRequests";
import AlumniDirectory from "./pages/AlumniDirectory";
import AlumniProfile from "./pages/AlumniProfile";
import EditAlumniProfile from "./pages/EditAlumniProfile";
import AlumniChat from "./pages/AlumniChat";
import Events from "./pages/Events";

function getRedirectPathForAuthenticatedUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  let role = localStorage.getItem("role");

  if (!role) {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      role = user?.role || "";
    } catch {
      role = "";
    }
  }

  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "admin") return "/admin/dashboard";
  if (normalizedRole === "alumni") return "/alumni-dashboard";
  return "/student";
}

function PublicRoute({ children }) {
  const authRedirectPath = getRedirectPathForAuthenticatedUser();

  if (authRedirectPath) {
    return <Navigate to={authRedirectPath} replace />;
  }

  return children;
}

function BackNavigationGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const lockedPathRef = useRef("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    lockedPathRef.current = currentPath;
    window.history.pushState({ noBackWhenAuthenticated: true }, "", window.location.href);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handlePopState = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const fallbackPath = lockedPathRef.current || getRedirectPathForAuthenticatedUser() || "/";
      navigate(fallbackPath, { replace: true });
      window.history.pushState({ noBackWhenAuthenticated: true }, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <BackNavigationGuard />
      <Routes>
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <PublicRoute>
              <AdminLogin />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opportunity"
          element={
            <ProtectedRoute>
              <StudentOpportunities />
            </ProtectedRoute>
          }
        />
        <Route path="/mentorship" element={<Mentorship />} />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumni-dashboard"
          element={
            <ProtectedRoute allowedRoles={["alumni"]}>
              <AlumniDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumni-directory"
          element={
            <ProtectedRoute allowedRoles={["alumni"]}>
              <AlumniDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumni-directory/:id"
          element={
            <ProtectedRoute allowedRoles={["alumni"]}>
              <AlumniProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumni-profile/edit"
          element={
            <ProtectedRoute allowedRoles={["alumni"]}>
              <EditAlumniProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumni-chat"
          element={
            <ProtectedRoute allowedRoles={["alumni"]}>
              <AlumniChat />
            </ProtectedRoute>
          }
        />
        <Route path="/post-opportunity" element={<PostOpportunity />} />
        <Route path="/my-opportunities" element={<MyOpportunities />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-opportunities"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageOpportunities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentorship-requests"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminMentorshipRequests />
            </ProtectedRoute>
          }
        />
        <Route path="/view-applicants" element={<ViewApplicants />} />
        <Route path="/mentorship-requests" element={<MentorshipRequests />} />
      </Routes>
    </Router>
  );
}

export default App;
