import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// 👇 adjust this if you already have a central axios instance/base URL
// (e.g. import api from "../utils/axiosInstance" and use api.post(...) instead)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Contact = () => {
  const revealRefs = useRef([]);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cv-in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Fill in every field",
        text: "Name, email, and message are all required.",
      });
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/contact/submit`, form);

      setForm({ name: "", email: "", message: "" });
      Swal.fire({
        icon: "success",
        title: "Message sent",
        text: "We'll get back to you soon.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text:
          error.response?.data?.message ||
          "Couldn't send your message. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cv-about">
      <section className="cv-about-hero">
        <span className="cv-home-eyebrow cv-reveal" ref={addRef}>
          <i className="fa-solid fa-envelope-open-text"></i> GET IN TOUCH · NO. 004
        </span>
        <h1 className="cv-about-title cv-reveal" ref={addRef}>
          Have a question?
          <br />
          <span>Send us a dispatch.</span>
        </h1>
        <p className="cv-about-lede cv-reveal" ref={addRef}>
          Whether it's a bug report, a feature idea, or just a hello — the
          line is open. We read every message and reply as soon as we can.
        </p>
      </section>

      <section className="cv-contact-grid">
        <div className="cv-contact-info cv-reveal cv-reveal-left" ref={addRef}>
          <div className="cv-contact-info-card">
            <i className="fa-solid fa-envelope"></i>
            <h3>Email</h3>
            <p>support@talkify.app</p>
          </div>
          <div className="cv-contact-info-card">
            <i className="fa-solid fa-phone"></i>
            <h3>Phone</h3>
            <p>+91 98765 43210</p>
          </div>
          <div className="cv-contact-info-card">
            <i className="fa-solid fa-location-dot"></i>
            <h3>Location</h3>
            <p>Indore, Madhya Pradesh, India</p>
          </div>
          <div className="cv-contact-info-card">
            <i className="fa-solid fa-clock"></i>
            <h3>Response time</h3>
            <p>Usually within 24 hours</p>
          </div>
        </div>

        <form
          className="cv-contact-form cv-reveal cv-reveal-right"
          ref={addRef}
          onSubmit={handleSubmit}
        >
          <span className="cv-auth-stamp" style={{ color: "var(--amber)" }}>
            SEND A MESSAGE
          </span>

          <div className="cv-auth-field">
            <i className="fa-solid fa-user"></i>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="cv-auth-field">
            <i className="fa-solid fa-envelope"></i>
            <input
              type="email"
              name="email"
              placeholder="Your email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="cv-auth-field cv-contact-textarea-field">
            <i className="fa-solid fa-message"></i>
            <textarea
              name="message"
              placeholder="How can we help?"
              rows={5}
              value={form.message}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="cv-btn-primary cv-auth-submit cv-cta-shine"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send Message"}
            {!submitting && <i className="fa-solid fa-paper-plane"></i>}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Contact;