import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Same values as the schema defaults on the backend — used only as a
// fallback so the page never looks broken while the fetch is in flight
// or if the API call fails for some reason.
const DEFAULT_CONTENT = {
  heroEyebrow: "LIVE DISPATCH · NO. 001",
  heroTitleLine1: "Every message,",
  heroTitleLine2: "delivered the moment it's sent.",
  heroSubtitle:
    "Talkify is a real-time messaging line for the people you actually talk to — one-on-one or in a group, with read receipts, replies, and media, minus the noise.",
  heroCtaPrimaryText: "Start Talking",
  heroCtaGhostText: "I already have an account",
  wireThreadLabel: 'THREAD — "DESIGN CREW"',
  logSectionTitle: "The dispatch, entry by entry",
  entries: [
    {
      icon: "fa-solid fa-bolt",
      title: "Real-time, always",
      description: "Messages land the instant they're sent — no refresh, no lag, no waiting on the wire.",
    },
    {
      icon: "fa-solid fa-users",
      title: "Groups that hold up",
      description: "Invite codes, admins, and member controls built for threads that actually get busy.",
    },
    {
      icon: "fa-solid fa-check-double",
      title: "Know where you stand",
      description: "Sent, delivered, seen. Replies and edits stay attached to the message they belong to.",
    },
    {
      icon: "fa-solid fa-image",
      title: "Media, handled well",
      description: "Drop in photos and files without losing the thread of the conversation around them.",
    },
  ],
  closerTitle: "Your line is open.",
  closerSubtitle: "Create an account and send your first dispatch in under a minute.",
  closerButtonText: "Create Account",
};

// Change this if your backend runs on a different URL / uses an env var
const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000";

const Home = () => {
  const navigate = useNavigate();
  const revealRefs = useRef([]);
  const [content, setContent] = useState(DEFAULT_CONTENT);

  // Fetch the admin-editable content once on mount. Falls back silently
  // to DEFAULT_CONTENT if the request fails, so the page still renders.
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/content/home`);
        if (res.data?.content) {
          setContent(res.data.content);
        }
      } catch (error) {
        console.log("Failed to load home content, using defaults:", error);
      }
    };

    fetchContent();
  }, []);

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
  }, [content]); // re-run so newly rendered entry cards get observed too

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="cv-home">
      <section className="cv-home-hero">
        <div className="cv-home-hero-copy cv-reveal cv-reveal-left" ref={addRef}>
          <span className="cv-home-eyebrow cv-pulse-badge">
            <i className="fa-solid fa-satellite-dish"></i> {content.heroEyebrow}
          </span>
          <h1 className="cv-home-title">
            {content.heroTitleLine1}
            <br />
            <span className="cv-gradient-text">{content.heroTitleLine2}</span>
          </h1>
          <p className="cv-home-subtitle">{content.heroSubtitle}</p>
          <div className="cv-home-cta-row">
            <button className="cv-btn-primary cv-home-cta cv-cta-shine" onClick={() => navigate("/register")}>
              {content.heroCtaPrimaryText} <i className="fa-solid fa-arrow-right cv-cta-arrow"></i>
            </button>
            <button className="cv-btn-ghost cv-home-cta-ghost" onClick={() => navigate("/login")}>
              {content.heroCtaGhostText}
            </button>
          </div>
        </div>

        <div className="cv-home-wire cv-reveal cv-reveal-right cv-float" ref={addRef}>
          <div className="cv-home-wire-head">
            <span>{content.wireThreadLabel}</span>
            <span className="cv-online-text cv-blink-dot">● ONLINE</span>
          </div>
          <div className="cv-home-wire-body">
            <div className="cv-msg-row theirs cv-msg-in cv-msg-delay-1">
              <div className="cv-bubble theirs">
                <div className="cv-sender">Rohan</div>
                Hi buddy!
                <div className="cv-stamp">09:14</div>
              </div>
            </div>
            <div className="cv-msg-row mine cv-msg-in cv-msg-delay-2">
              <div className="cv-bubble mine">
                hello
                <div className="cv-stamp">
                  09:15 <i className="fa-solid fa-check-double cv-tick-seen"></i>
                </div>
              </div>
            </div>
            <div className="cv-home-wire-typing cv-msg-in cv-msg-delay-3">
              <span className="cv-typing-text">
                Rohan is typing
                <span className="cv-typing-dots">
                  <span></span><span></span><span></span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-home-log">
        <h2 className="cv-home-log-title cv-reveal" ref={addRef}>
          {content.logSectionTitle}
        </h2>
        <div className="cv-home-log-grid">
          {content.entries.map((entry, index) => (
            <div
              key={index}
              className={`cv-home-log-entry cv-reveal cv-reveal-up cv-reveal-delay-${index + 1}`}
              ref={addRef}
            >
              <span className="cv-home-log-num">ENTRY / 0{index + 1}</span>
              <i className={entry.icon}></i>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cv-home-closer cv-reveal" ref={addRef}>
        <h2>{content.closerTitle}</h2>
        <p>{content.closerSubtitle}</p>
        <button className="cv-btn-primary cv-home-cta cv-cta-shine" onClick={() => navigate("/register")}>
          {content.closerButtonText}
        </button>
      </section>
    </div>
  );
};

export default Home;