import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityFeed />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="/alumni-dashboard" element={<AlumniDashboard />} />
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
