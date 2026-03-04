import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <span className="logo-icon">🎓</span>
          <span className="logo-text">Alumni Connect</span>
        </div>

        {/* Navigation Links */}
        <div className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#about" className="nav-link">
            About
          </a>
          <a href="#contact" className="nav-link">
            Contact
          </a>
        </div>

        {/* Auth Buttons / User Menu */}
        <div className="navbar-auth">
          {!isLoggedIn ? (
            <>
              <button
                className="btn-signin"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
              <button
                className="btn-signup"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="user-menu">
              {userRole === "alumni" ? (
                <button
                  className="nav-link"
                  onClick={() => navigate("/alumni-dashboard")}
                >
                  Dashboard
                </button>
              ) : (
                <button
                  className="nav-link"
                  onClick={() => navigate("/student")}
                >
                  Dashboard
                </button>
              )}
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Hamburger Menu */}
        <div className="hamburger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
