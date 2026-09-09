import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all fields before submitting.",
        background: "#0d1217",
        color: "#f8fafc",
        confirmButtonColor: "#00f5a0",
      });
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/contact/submit`, form);

      setForm({ name: "", email: "", message: "" });
      Swal.fire({
        icon: "success",
        title: "Message Sent!",
        text: "Thank you for reaching out. We will get back to you shortly.",
        background: "#0d1217",
        color: "#f8fafc",
        confirmButtonColor: "#00f5a0",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to Send",
        text:
          error.response?.data?.message ||
          "Could not send message. Please check your network and retry.",
        background: "#0d1217",
        color: "#f8fafc",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tk-clean-landing tk-contact-page">
      {/* 1. HERO SECTION */}
      <section className="tk-clean-hero">
        <div className="tk-hero-container">
          <div className="tk-hero-badge">
            <span className="tk-badge-pulse"></span>
            <span>GET IN TOUCH</span>
          </div>

          <h1 className="tk-hero-title">
            Have a question?{" "}
            <span className="tk-hero-highlight">We're here to help.</span>
          </h1>

          <p className="tk-hero-subtitle" style={{ maxWidth: "720px" }}>
            Whether you have questions about Talkify features, need technical support, or want to share feedback, we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* 2. CONTACT CONTENT GRID */}
      <section className="tk-features-section" style={{ paddingTop: "0" }}>
        <div className="tk-contact-layout-grid">
          {/* Left: Contact Info Cards */}
          <div className="tk-contact-info-list">
            <div className="tk-feature-card">
              <div
                className="tk-feature-icon-wrap"
                style={{
                  background: "rgba(0, 245, 160, 0.08)",
                  color: "#00f5a0",
                  borderColor: "rgba(0, 245, 160, 0.2)",
                }}
              >
                <i className="fa-solid fa-envelope"></i>
              </div>
              <div className="tk-feature-body">
                <div className="tk-feature-meta">
                  <h3 className="tk-feature-title">Email Support</h3>
                  <span className="tk-feature-badge" style={{ color: "#00f5a0", borderColor: "rgba(0, 245, 160, 0.3)" }}>
                    Direct
                  </span>
                </div>
                <p className="tk-feature-desc" style={{ color: "#f8fafc", fontWeight: "600" }}>
                  support@talkify.app
                </p>
                <p className="tk-feature-desc" style={{ fontSize: "12px", marginTop: "4px" }}>
                  Usually replies within 2 hours
                </p>
              </div>
            </div>

            <div className="tk-feature-card">
              <div
                className="tk-feature-icon-wrap"
                style={{
                  background: "rgba(0, 212, 255, 0.08)",
                  color: "#00d4ff",
                  borderColor: "rgba(0, 212, 255, 0.2)",
                }}
              >
                <i className="fa-solid fa-phone"></i>
              </div>
              <div className="tk-feature-body">
                <div className="tk-feature-meta">
                  <h3 className="tk-feature-title">Phone Support</h3>
                  <span className="tk-feature-badge" style={{ color: "#00d4ff", borderColor: "rgba(0, 212, 255, 0.3)" }}>
                    Mon - Fri
                  </span>
                </div>
                <p className="tk-feature-desc" style={{ color: "#f8fafc", fontWeight: "600" }}>
                  +91 74153 77427
                </p>
                <p className="tk-feature-desc" style={{ fontSize: "12px", marginTop: "4px" }}>
                  9:00 AM – 7:00 PM IST
                </p>
              </div>
            </div>

            <div className="tk-feature-card">
              <div
                className="tk-feature-icon-wrap"
                style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  color: "#10b981",
                  borderColor: "rgba(16, 185, 129, 0.2)",
                }}
              >
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <div className="tk-feature-body">
                <div className="tk-feature-meta">
                  <h3 className="tk-feature-title">Location</h3>
                  <span className="tk-feature-badge" style={{ color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                    HQ
                  </span>
                </div>
                <p className="tk-feature-desc" style={{ color: "#f8fafc", fontWeight: "600" }}>
                  Indore, Madhya Pradesh, India
                </p>
                <p className="tk-feature-desc" style={{ fontSize: "12px", marginTop: "4px" }}>
                  Global Mesh Support
                </p>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="tk-contact-form-container">
            <div className="tk-feature-card" style={{ padding: "34px 28px" }}>
              <div style={{ marginBottom: "22px" }}>
                <span className="tk-section-tag">FEEDBACK &amp; INQUIRIES</span>
                <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", margin: "4px 0 0" }}>
                  Send us a message
                </h3>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Alex Rivera"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "#080b0e",
                      border: "1px solid #1a2430",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="alex@example.com"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "#080b0e",
                      border: "1px solid #1a2430",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows="4"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help you..."
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "#080b0e",
                      border: "1px solid #1a2430",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "14px",
                      outline: "none",
                      resize: "vertical",
                    }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="tk-btn-hero-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
                >
                  {submitting ? (
                    <span>Sending message...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <i className="fa-solid fa-paper-plane tk-arrow-anim"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;