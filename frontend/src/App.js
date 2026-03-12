import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
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
<Route path="/view-applicants" element={<ViewApplicants />} />
<Route path="/mentorship-requests" element={<MentorshipRequests />} />
      </Routes>
    </Router>
  );
}

export default App;
