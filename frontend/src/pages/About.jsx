import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DEFAULT_CONTENT = {
  heroEyebrow: "ABOUT TALKIFY",
  aboutTitleLine1: "Built for real conversations,",
  aboutTitleLine2: "not algorithmic feeds.",
  aboutLede:
    "Talkify was conceived from a core premise: talking with teammates and friends should feel direct, fast, and private. We stripped back the clutter to focus on what real-time messaging should be — instant, reliable, and completely yours.",
  timelineSectionTitle: "Our Journey & Milestones",
  timelineEntries: [
    {
      stamp: "MILESTONE 01",
      title: "Real-Time WebSocket Core",
      description:
        "Engineered the foundational low-latency messaging engine delivering instant two-way sync across clients.",
    },
    {
      stamp: "MILESTONE 02",
      title: "Group Channels & Invites",
      description:
        "Built squad rooms, customized invite codes, and simple group member management for teams.",
    },
    {
      stamp: "MILESTONE 03",
      title: "Voice Notes & Media Hub",
      description:
        "Added voice waveforms, photo sharing, file drops, and real-time read receipts.",
    },
    {
      stamp: "MILESTONE 04",
      title: "Clean Modern Experience",
      description:
        "Polished with responsive touch design, robust security, and an intuitive user interface.",
    },
  ],
  valuesSectionTitle: "Our Core Principles",
  valueCards: [
    {
      icon: "fa-solid fa-bolt",
      title: "Speed First",
      description: "Real-time means instant packet delivery. No artificial waiting spinners or sluggish client bloat.",
    },
    {
      icon: "fa-solid fa-shield-halved",
      title: "Privacy & Security",
      description: "Your messages, group chats, and media belong exclusively to the participants inside them.",
    },
    {
      icon: "fa-solid fa-wand-magic-sparkles",
      title: "Simple & Purpose-Built",
      description: "No ads, no algorithmic feeds, no attention-harvesting tricks. Only clear, direct conversation.",
    },
  ],
  statThreadsTarget: "15000+",
  statThreadsLabel: "Active Channels",
  statMessagesTarget: "5000000+",
  statMessagesLabel: "Messages Delivered",
  statUptimeTarget: "99.99%",
  statUptimeLabel: "System Reliability",
  closerTitle: "Ready to join Talkify?",
  closerSubtitle: "Join thousands of teams and creators communicating with zero lag.",
  closerButtonText: "Create Free Account",
};

const useCountUp = (target, duration, start) => {
  const [value, setValue] = useState("0");

  useEffect(() => {
    if (!start || !target) return;

    const isPercent = typeof target === "string" && target.includes("%");
    const isPlus = typeof target === "string" && target.includes("+");
    const numeric = parseFloat(target) || 0;

    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numeric * eased;

      if (isPercent) {
        setValue(current.toFixed(2) + "%");
      } else if (numeric >= 1000000) {
        setValue(
          (current / 1000000).toFixed(current >= 1000000 ? 1 : 0) +
            "M" +
            (isPlus ? "+" : "")
        );
      } else if (numeric >= 1000) {
        setValue(Math.round(current / 1000) + "k" + (isPlus ? "+" : ""));
      } else {
        setValue(Math.round(current) + (isPlus ? "+" : ""));
      }

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [start, target, duration]);

  return value;
};

const About = () => {
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [statsInView, setStatsInView] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/content/about`
        );
        if (res.data?.content) {
          setContent((prev) => ({ ...prev, ...res.data.content }));
        }
      } catch (error) {
        console.log("Using default about content:", error);
      }
    };

    fetchContent();
  }, []);

  const threads = useCountUp(content.statThreadsTarget, 1400, statsInView);
  const messages = useCountUp(content.statMessagesTarget, 1600, statsInView);
  const uptime = useCountUp(content.statUptimeTarget, 1400, statsInView);

  useEffect(() => {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsInView(true);
            statsObserver.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (statsRef.current) statsObserver.observe(statsRef.current);

    // Auto-trigger if observer is delayed
    const timer = setTimeout(() => setStatsInView(true), 500);

    return () => {
      statsObserver.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="tk-clean-landing tk-about-page">
      {/* 1. HERO SECTION */}
      <section className="tk-clean-hero">
        <div className="tk-hero-container">
          <div className="tk-hero-badge">
            <span className="tk-badge-pulse"></span>
            <span>{content.heroEyebrow || "ABOUT TALKIFY"}</span>
          </div>

          <h1 className="tk-hero-title">
            {content.aboutTitleLine1}{" "}
            <span className="tk-hero-highlight">{content.aboutTitleLine2}</span>
          </h1>

          <p className="tk-hero-subtitle" style={{ maxWidth: "780px" }}>
            {content.aboutLede}
          </p>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="tk-about-stats-section" ref={statsRef}>
        <div className="tk-stats-grid">
          <div className="tk-stat-card">
            <div className="tk-stat-icon-wrap tk-stat-cyan">
              <i className="fa-solid fa-users-viewfinder"></i>
            </div>
            <div className="tk-stat-num">{threads || "15k+"}</div>
            <div className="tk-stat-label">{content.statThreadsLabel}</div>
          </div>

          <div className="tk-stat-card">
            <div className="tk-stat-icon-wrap tk-stat-emerald">
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div className="tk-stat-num">{messages || "5M+"}</div>
            <div className="tk-stat-label">{content.statMessagesLabel}</div>
          </div>

          <div className="tk-stat-card">
            <div className="tk-stat-icon-wrap tk-stat-mint">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="tk-stat-num">{uptime || "99.99%"}</div>
            <div className="tk-stat-label">{content.statUptimeLabel}</div>
          </div>
        </div>
      </section>

      {/* 3. CORE PRINCIPLES */}
      <section className="tk-features-section">
        <div className="tk-section-header">
          <span className="tk-section-tag">OUR MISSION</span>
          <h2 className="tk-section-heading">
            {content.valuesSectionTitle || "Our Core Principles"}
          </h2>
          <p className="tk-section-desc">
            We believe real-time communication should be instantaneous, private, and uncluttered.
          </p>
        </div>

        <div className="tk-features-grid">
          {(content.valueCards || []).map((card, idx) => (
            <div key={idx} className="tk-feature-card">
              <div
                className="tk-feature-icon-wrap"
                style={{
                  background: "rgba(0, 245, 160, 0.08)",
                  color: idx === 0 ? "#00f5a0" : idx === 1 ? "#00d4ff" : "#10b981",
                  borderColor: "rgba(0, 245, 160, 0.2)",
                }}
              >
                <i className={card.icon}></i>
              </div>
              <div className="tk-feature-body">
                <h3 className="tk-feature-title" style={{ marginBottom: "8px" }}>
                  {card.title}
                </h3>
                <p className="tk-feature-desc">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. JOURNEY / TIMELINE */}
      <section className="tk-steps-section">
        <div className="tk-section-header">
          <span className="tk-section-tag">ROADMAP &amp; MILESTONES</span>
          <h2 className="tk-section-heading">
            {content.timelineSectionTitle || "Our Journey & Milestones"}
          </h2>
          <p className="tk-section-desc">
            How Talkify evolved into a high-performance communication platform.
          </p>
        </div>

        <div className="tk-steps-grid">
          {(content.timelineEntries || []).map((entry, idx) => (
            <div key={idx} className="tk-step-card">
              <div className="tk-step-number">{entry.stamp || `0${idx + 1}`}</div>
              <div className="tk-step-icon">
                <i
                  className={
                    idx === 0
                      ? "fa-solid fa-server"
                      : idx === 1
                      ? "fa-solid fa-users"
                      : idx === 2
                      ? "fa-solid fa-microphone-lines"
                      : "fa-solid fa-sparkles"
                  }
                ></i>
              </div>
              <h3 className="tk-step-title">{entry.title}</h3>
              <p className="tk-step-desc">{entry.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="tk-cta-section">
        <div className="tk-cta-card">
          <div className="tk-cta-glow"></div>
          <div className="tk-cta-content">
            <h2 className="tk-cta-title">
              {content.closerTitle || "Ready to experience Talkify?"}
            </h2>
            <p className="tk-cta-subtitle">
              {content.closerSubtitle ||
                "Join thousands of teams and creators communicating with zero lag."}
            </p>
            <div className="tk-cta-btns">
              <button
                className="tk-btn-hero-primary tk-btn-large"
                onClick={() => navigate("/register")}
              >
                <span>{content.closerButtonText || "Create Free Account"}</span>
                <i className="fa-solid fa-arrow-right tk-arrow-anim"></i>
              </button>
              <button
                className="tk-btn-hero-secondary tk-btn-large"
                onClick={() => navigate("/login")}
              >
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;