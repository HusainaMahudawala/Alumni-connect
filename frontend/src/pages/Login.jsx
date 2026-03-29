import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import loginImage from "../assets/login.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post(
      "http://localhost:5000/api/auth/login",
      { email, password }
    );

    localStorage.setItem("token", res.data.token);

    const role = res.data.user.role; // get role from backend
    localStorage.setItem("role", role);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    if (role === "alumni") {
      navigate("/alumni-dashboard", { replace: true });
    } else if (role === "student") {
      navigate("/student", { replace: true });
    } else if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate("/", { replace: true });
    }

  } catch (err) {
    alert(err.response?.data?.message || "Login Failed");
  }
};

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Panel - Illustration */}
        <div className="login-left">
          <div className="illustration">
            <div className="illustration-circle circle-1"></div>
            <div className="illustration-circle circle-2"></div>
            <div className="illustration-circle circle-3"></div>
            <div className="illustration-content">
              <img className="user-illustration" src={loginImage} alt="Welcome" />
              <p className="illustration-text">Welcome Back!</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="login-right">
          <div className="form-header">
            <h1>Sign In to Your Account</h1>
            <p>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="signin-btn">
              Sign In
            </button>

            {/* Social Login */}
            <div className="social-login">
              <p>Or, continue with</p>
              <div className="social-buttons">
                <button type="button" className="social-btn google-btn">
                  Google
                </button>
                <button type="button" className="social-btn facebook-btn">
                  Facebook
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className="register-link">
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="link-btn"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
