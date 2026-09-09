import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const goTo = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    Swal.fire({
      icon: "success",
      title: "Subscribed to Updates!",
      text: "Thanks for subscribing! You'll get product news and release updates.",
      background: "#0e1326",
      color: "#f8fafc",
      confirmButtonColor: "#6366f1",
      timer: 2000,
      showConfirmButton: false,
    });
    setEmail("");
  };

  return (
    <footer className="rb-footer">
      <div className="rb-footer-inner">
        {/* Brand Column */}
        <div className="rb-footer-brand-col">
          <div className="rb-footer-brand" onClick={() => goTo("/")}>
            <div className="rb-brand-icon-box">
              <i className="fa-solid fa-comments rb-brand-icon"></i>
            </div>
            <span className="rb-brand-name">
              <span className="rb-brand-part-1">Talk</span>
              <span className="rb-brand-part-2">ify</span>
              <span className="rb-brand-dot"></span>
            </span>
          </div>
          <p className="rb-footer-tagline">
            Real-time messaging designed for modern conversations. Fast, secure, and intuitive for teams and individuals.
          </p>

          <div className="rb-footer-status">
            <span className="rb-status-dot"></span>
            <span>All Systems Operational</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="rb-footer-links-grid">
          <div className="rb-footer-col">
            <span className="rb-footer-col-title">Platform</span>
            <span className="rb-footer-link" onClick={() => goTo("/")}>
              Home & Overview
            </span>
            <span className="rb-footer-link" onClick={() => goTo("/chat")}>
              Live Messenger
            </span>
            <span className="rb-footer-link" onClick={() => goTo("/about")}>
              Architecture
            </span>
            <span className="rb-footer-link" onClick={() => goTo("/register")}>
              Create Channel
            </span>
          </div>

          <div className="rb-footer-col">
            <span className="rb-footer-col-title">Company</span>
            <span className="rb-footer-link" onClick={() => goTo("/about")}>
              About Us
            </span>
            <span className="rb-footer-link" onClick={() => goTo("/contact")}>
              Contact Dispatch
            </span>
            <span
              className="rb-footer-link"
              onClick={() => window.open("https://github.com", "_blank")}
            >
              Open Source
            </span>
            <span className="rb-footer-link" onClick={() => goTo("/contact")}>
              Security & E2E
            </span>
          </div>

          <div className="rb-footer-col rb-footer-col-newsletter">
            <span className="rb-footer-col-title">Stay Connected</span>
            <p className="rb-footer-newsletter-desc">
              Subscribe for real-time changelog notifications and product drops.
            </p>

            <form className="rb-footer-form" onSubmit={handleSubscribe}>
              <div className="rb-footer-input-wrap">
                <i className="fa-solid fa-envelope rb-footer-input-icon"></i>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  className="rb-footer-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="rb-footer-btn" aria-label="Subscribe">
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </form>

            <div className="rb-footer-socials">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="rb-social-icon"
                aria-label="Twitter"
              >
                <i className="fa-brands fa-x-twitter"></i>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="rb-social-icon"
                aria-label="GitHub"
              >
                <i className="fa-brands fa-github"></i>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="rb-social-icon"
                aria-label="Discord"
              >
                <i className="fa-brands fa-discord"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rb-social-icon"
                aria-label="Instagram"
              >
                <i className="fa-brands fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="rb-footer-bottom">
        <div className="rb-footer-bottom-inner">
          <p>© {new Date().getFullYear()} Talkify. All rights reserved.</p>
          <div className="rb-footer-legal">
            <span>Privacy Policy</span>
            <span className="rb-dot-sep">•</span>
            <span>Terms of Service</span>
            <span className="rb-dot-sep">•</span>
            <span>Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;