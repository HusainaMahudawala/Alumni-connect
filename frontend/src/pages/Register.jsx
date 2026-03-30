import React, { useState } from "react";
import axios from "axios";
import "./Register.css";
import { useNavigate } from "react-router-dom";
  import loginImage from "../assets/login.png";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Student-specific fields
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");

  // Alumni-specific fields
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [mentorshipSlots, setMentorshipSlots] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select your role (Student or Alumni)");
      return;
    }

    // Validation
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (role === "student") {
      if (!skills.trim() || !interests.trim()) {
        setError("Please fill in skills and interests");
        return;
      }
    } else if (role === "alumni") {
      if (!company.trim()) {
        setError("Please fill in company name");
        return;
      }
      if (!experience || experience < 0) {
        setError("Please enter valid years of experience");
        return;
      }
      const parsedMentorshipSlots = Number.parseInt(mentorshipSlots, 10);
      if (!Number.isInteger(parsedMentorshipSlots) || parsedMentorshipSlots < 1) {
        setError("Mentorship slots must be at least 1");
        return;
      }
    }

    setLoading(true);

    try {
      const userData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      };

      if (role === "student") {
        userData.skills = skills.split(",").map((skill) => skill.trim()).filter(s => s);
        userData.interests = interests.split(",").map((interest) => interest.trim()).filter(i => i);
      } else if (role === "alumni") {
        userData.company = company.trim();
        userData.experience = parseInt(experience) || 0;
        userData.mentorshipSlots = Number.parseInt(mentorshipSlots, 10);
      }

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        userData
      );

      // Store token and user info
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.user.role);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userName", response.data.user.name);
      }

      alert("Registration Successful ✅");
      
      // Navigate based on role
      if (role === "student") {
        navigate("/student");
      } else {
        navigate("/alumni-dashboard");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Left Panel - Illustration */}
        <div className="register-left">
          <div className="illustration">
            <div className="illustration-circle circle-1"></div>
            <div className="illustration-circle circle-2"></div>
            <div className="illustration-circle circle-3"></div>
            <div className="illustration-content">
              <img className="user-illustration" src={loginImage} alt="Join Our Community" />
              <p className="illustration-text">Join Our Community</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="register-right">
          <div className="form-header">
            <h1>Create Your Account</h1>
            <p>Join Alumni Connect and grow your network</p>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Role Selection */}
          {!role ? (
            <div className="role-selection">
              <h3>Choose Your Role</h3>
              <div className="role-buttons">
                <button
                  type="button"
                  className="role-btn student-btn"
                  onClick={() => setRole("student")}
                >
                  <span className="role-icon">👨‍🎓</span>
                  <span className="role-label">Student</span>
                </button>
                <button
                  type="button"
                  className="role-btn alumni-btn"
                  onClick={() => setRole("alumni")}
                >
                  <span className="role-icon">👨‍💼</span>
                  <span className="role-label">Alumni</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="register-form">
              {/* Role Badge */}
              <div className="role-badge">
                <span>{role === "student" ? "👨‍🎓 Student" : "👨‍💼 Alumni"}</span>
                <button
                  type="button"
                  className="change-role-btn"
                  onClick={() => setRole(null)}
                >
                  Change
                </button>
              </div>

              {/* Basic Information */}
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Create Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Conditional Fields - Student */}
              {role === "student" && (
                <>
                  <div className="form-group">
                    <label htmlFor="skills">Skills</label>
                    <input
                      id="skills"
                      type="text"
                      placeholder="E.g., JavaScript, Python, React (comma-separated)"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="interests">Interests</label>
                    <input
                      id="interests"
                      type="text"
                      placeholder="E.g., Web Development, AI, Startup (comma-separated)"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Conditional Fields - Alumni */}
              {role === "alumni" && (
                <>
                  <div className="form-group">
                    <label htmlFor="company">Current Company</label>
                    <input
                      id="company"
                      type="text"
                      placeholder="E.g., Google, Microsoft, StartUp Inc"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="experience">Years of Experience</label>
                    <input
                      id="experience"
                      type="number"
                      placeholder="E.g., 5"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mentorshipSlots">Mentorship Slots Available</label>
                    <input
                      id="mentorshipSlots"
                      type="number"
                      placeholder="E.g., 3"
                      value={mentorshipSlots}
                      onChange={(e) => setMentorshipSlots(e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="signup-btn"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>

              {/* Social Login */}
              <div className="social-login">
                <p>or sign up with</p>
                <div className="social-buttons">
                  <button type="button" className="social-btn google-btn">
                    Google
                  </button>
                  <button type="button" className="social-btn facebook-btn">
                    Facebook
                  </button>
                </div>
              </div>

              {/* Login Link */}
              <div className="login-link">
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="link-btn"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
