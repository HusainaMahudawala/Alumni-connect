import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <Router>
      <Routes>
        <Route
  path="/student"
  element={
    <ProtectedRoute>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>

        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
         <Route path="/student" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
