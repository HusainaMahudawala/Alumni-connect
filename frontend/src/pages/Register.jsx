import React, { useState } from "react";
import axios from "axios";
import "./Register.css";
import { useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        role: "student",
      });

      alert("Registration Successful ✅");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed ❌");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        {/* Left Panel */}
        <div className="left-section">
          <h1>Welcome Back!</h1>
          <p>
            To keep connected with us please login with your personal info
          </p>
          <button onClick={() => navigate("/")}>SIGN IN</button>
        </div>

        {/* Right Panel */}
        <div className="right-section">
          <h2>Create Account</h2>

          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="signup-btn">
              SIGN UP
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Register;
