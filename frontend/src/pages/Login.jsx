import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";

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
      navigate("/student");

    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-in">

        {/* Left Panel */}
        <div className="left-panel">
          <h1>Hello Mate!</h1>
          <p>
           Enter your personal details and start journey with us
          </p>
          <button onClick={() => navigate("/register")}>
            SIGN UP
          </button>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <h2>Sign In</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="submit-btn">
              SIGN IN
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;
