import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      title: "Mentorship Connections",
      description:
        "Connect with experienced alumni mentors who can guide your career path and professional growth.",
      icon: "👨‍🏫",
    },
    {
      id: 2,
      title: "Job Opportunities",
      description:
        "Access exclusive job and internship opportunities posted by alumni and partner companies.",
      icon: "💼",
    },
    {
      id: 3,
      title: "Networking Events",
      description:
        "Attend virtual and in-person networking events to build meaningful connections with alumni.",
      icon: "🤝",
    },
    {
      id: 4,
      title: "Career Resources",
      description:
        "Get access to resume tips, interview preparation, and career development resources.",
      icon: "📚",
    },
    {
      id: 5,
      title: "Alumni Network",
      description:
        "Join a vibrant community of alumni across industries and connect with peers globally.",
      icon: "🌐",
    },
    {
      id: 6,
      title: "Success Stories",
      description:
        "Learn from alumni success stories and get inspired by their career journeys.",
      icon: "⭐",
    },
  ];

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Software Engineer at Tech Corp",
      image: "👩‍💻",
      quote:
        "Alumni Connect helped me land my dream job through the mentorship program and job board.",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Product Manager at StartUp Inc",
      image: "👨‍💼",
      quote:
        "The networking events connected me with amazing alumni who became lifelong professional friends.",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Consultant at Leading Firm",
      image: "👩‍💻",
      quote:
        "My mentor from Alumni Connect guided me through my career transition and encouraged my growth.",
    },
  ];

  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Connect with Alumni, <span>Build Your Future</span>
          </h1>
          <p className="hero-subtitle">
            Join a thriving network of alumni mentors, job opportunities, and career growth.
            Start your journey to success today.
          </p>
          <div className="hero-buttons">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-illustration">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
            <p className="hero-emoji">🎓</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Join Alumni Connect?</h2>
          <p>We provide extensive features to help you grow and succeed</p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.id} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2>Success Stories from Our Community</h2>
          <p>Hear from alumni who have transformed their careers</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">{testimonial.image}</div>
                <div>
                  <h4>{testimonial.name}</h4>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
              <p className="testimonial-quote">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat">
          <h3>5000+</h3>
          <p>Active Alumni Members</p>
        </div>
        <div className="stat">
          <h3>500+</h3>
          <p>Job Opportunities Posted</p>
        </div>
        <div className="stat">
          <h3>1000+</h3>
          <p>Successful Mentorships</p>
        </div>
        <div className="stat">
          <h3>50+</h3>
          <p>Networking Events Annually</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Transform Your Career?</h2>
        <p>Join thousands of alumni building meaningful connections and advancing their careers</p>
        <button
          className="btn btn-primary btn-large"
          onClick={() => navigate("/register")}
        >
          Join Alumni Connect Today
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Alumni Connect</h4>
            <p>Building bridges between alumni and opportunities</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <p>🔗 LinkedIn | 📘 Facebook | 🐦 Twitter</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Alumni Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
