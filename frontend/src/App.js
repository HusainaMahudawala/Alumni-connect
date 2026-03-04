import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentOpportunities from "./pages/StudentOpportunities";
import Mentorship from "./pages/Mentorship";
import AlumniDashboard from "./pages/AlumniDashboard";
import LandingPage from "./pages/LandingPage";
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
      </Routes>
    </Router>
  );
}

export default App;
