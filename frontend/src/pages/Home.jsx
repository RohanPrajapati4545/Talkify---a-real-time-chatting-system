import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import LiveChatHeroWidget from "../components/reactbits/LiveChatHeroWidget";
import BentoGrid from "../components/reactbits/BentoGrid";

const DEFAULT_CONTENT = {
  heroEyebrow: "REAL-TIME SOCKET.IO & WEBRTC ENGINE",
  heroTitleLine1: "Connect, Chat & Call with",
  heroTitleLine2: "Zero Latency",
  heroSubtitle:
    "Fast, private, and crystal-clear communication for teams and squads. Experience instant messaging, HD voice notes, audio/video calls, and squad channels.",
  heroCtaPrimaryText: "Start Chatting Free",
  heroCtaGhostText: "Sign In to Account",
  featuresSectionTitle: "Built for Speed, Audio/Video & Collaboration",
  featuresSectionSubtitle: "Every tool you need to communicate smoothly without delays or unnecessary clutter.",
  closerTitle: "Ready to experience next-level communication?",
  closerSubtitle: "Create your free account today and start chatting with your squad in seconds.",
  closerButtonText: "Create Free Account",
};

const FEATURES = [
  {
    icon: "fa-solid fa-bolt",
    title: "Instant Messaging",
    desc: "Real-time delivery powered by Socket.IO with typing indicators and seen receipts.",
    badge: "Socket.IO",
    color: "#00f5a0",
  },
  {
    icon: "fa-solid fa-video",
    title: "HD Audio & Video Calls",
    desc: "Crystal-clear 1-on-1 and group WebRTC calls with camera toggling and mute controls.",
    badge: "WebRTC",
    color: "#00d4ff",
  },
  {
    icon: "fa-solid fa-microphone-lines",
    title: "HD Voice Notes",
    desc: "Record and share voice messages with interactive playback waveforms and timing.",
    badge: "Waveform Player",
    color: "#10b981",
  },
  {
    icon: "fa-solid fa-users-viewfinder",
    title: "Squad Channels & Rooms",
    desc: "Create vibrant community channels with unique invite codes and member management.",
    badge: "Squads",
    color: "#38bdf8",
  },
  {
    icon: "fa-solid fa-thumbtack",
    title: "Pinned Messages & Search",
    desc: "Pin crucial notices to the top and quickly search through chat history with ease.",
    badge: "Admin Tools",
    color: "#00f5a0",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Privacy & Block Controls",
    desc: "Granular participant permissions, user blocking, and secure end-to-end routing.",
    badge: "Security",
    color: "#34d399",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create Account",
    desc: "Sign up in seconds with your name and avatar to get instant access.",
    icon: "fa-solid fa-user-plus",
  },
  {
    step: "02",
    title: "Join or Create Squads",
    desc: "Start a 1-on-1 chat or create squad channels using custom invite codes.",
    icon: "fa-solid fa-layer-group",
  },
  {
    step: "03",
    title: "Chat & Call Instantly",
    desc: "Send instant messages, voice notes, media, or launch HD video calls anytime.",
    icon: "fa-solid fa-paper-plane",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { isAuth } = useSelector((state) => state.auth || {});
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/content/home`
        );
        if (res.data?.content) {
          const apiContent = res.data.content;
          // Filter out dummy test strings if present in DB
          setContent((prev) => ({
            ...prev,
            heroEyebrow: (apiContent.heroEyebrow && !apiContent.heroEyebrow.includes("hi friends")) 
              ? apiContent.heroEyebrow 
              : prev.heroEyebrow,
            heroTitleLine1: apiContent.heroTitleLine1 || prev.heroTitleLine1,
            heroTitleLine2: apiContent.heroTitleLine2 || prev.heroTitleLine2,
            heroSubtitle: (apiContent.heroSubtitle && !apiContent.heroSubtitle.includes("sdsd"))
              ? apiContent.heroSubtitle
              : prev.heroSubtitle,
            heroCtaPrimaryText: apiContent.heroCtaPrimaryText || prev.heroCtaPrimaryText,
            heroCtaGhostText: apiContent.heroCtaGhostText || prev.heroCtaGhostText,
            featuresSectionTitle: apiContent.featuresSectionTitle || prev.featuresSectionTitle,
            closerTitle: apiContent.closerTitle || prev.closerTitle,
            closerSubtitle: apiContent.closerSubtitle || prev.closerSubtitle,
          }));
        }
      } catch (error) {
        console.log("Using default home content:", error);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="tk-clean-landing">
      {/* 1. HERO SECTION */}
      <section className="tk-clean-hero">
        <div className="tk-hero-container">
          {/* Eyebrow badge */}
          <div className="tk-hero-badge">
            <span className="tk-badge-pulse"></span>
            <span>{content.heroEyebrow}</span>
          </div>

          {/* Headline */}
          <h1 className="tk-hero-title">
            {content.heroTitleLine1}{" "}
            <span className="tk-hero-highlight">{content.heroTitleLine2}</span>
          </h1>

          {/* Subtitle */}
          <p className="tk-hero-subtitle">
            {content.heroSubtitle}
          </p>

          {/* Action CTA Buttons */}
          <div className="tk-hero-cta-group">
            <button
              className="tk-btn-hero-primary"
              onClick={() => navigate(isAuth ? "/chat" : "/register")}
            >
              <span>{isAuth ? "Start Chatting" : content.heroCtaPrimaryText}</span>
              <i className="fa-solid fa-arrow-right tk-arrow-anim"></i>
            </button>

            {!isAuth && (
              <button
                className="tk-btn-hero-secondary"
                onClick={() => navigate("/login")}
              >
                <i className="fa-solid fa-arrow-right-to-bracket me-2"></i>
                <span>{content.heroCtaGhostText}</span>
              </button>
            )}
          </div>

          {/* Quick Features Pill Row */}
          <div className="tk-hero-pill-row">
            <div className="tk-pill-item">
              <i className="fa-solid fa-bolt tk-icon-emerald me-2"></i>
              <span>Socket.IO Zero-Lag</span>
            </div>
            <div className="tk-pill-divider"></div>
            <div className="tk-pill-item">
              <i className="fa-solid fa-video tk-icon-cyan me-2"></i>
              <span>WebRTC HD Calling</span>
            </div>
            <div className="tk-pill-divider"></div>
            <div className="tk-pill-item">
              <i className="fa-solid fa-wave-square tk-icon-mint me-2"></i>
              <span>Waveform Audio Notes</span>
            </div>
            <div className="tk-pill-divider"></div>
            <div className="tk-pill-item">
              <i className="fa-solid fa-shield-halved tk-icon-emerald me-2"></i>
              <span>Private &amp; Encrypted</span>
            </div>
          </div>

          {/* Interactive Live Chat Preview Mockup */}
          <div className="tk-hero-preview-wrapper">
            <div className="tk-preview-glow-bg"></div>
            <LiveChatHeroWidget />
          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES GRID */}
      <section className="tk-features-section">
        <div className="tk-section-header">
          <span className="tk-section-tag">CORE CAPABILITIES</span>
          <h2 className="tk-section-heading">
            {content.featuresSectionTitle}
          </h2>
          <p className="tk-section-desc">
            {content.featuresSectionSubtitle}
          </p>
        </div>

        <div className="tk-features-grid">
          {FEATURES.map((item, idx) => (
            <div
              key={idx}
              className="tk-feature-card"
            >
              <div
                className="tk-feature-icon-wrap"
                style={{
                  background: `rgba(0, 245, 160, 0.08)`,
                  color: item.color,
                  borderColor: `rgba(0, 245, 160, 0.2)`,
                }}
              >
                <i className={item.icon}></i>
              </div>
              <div className="tk-feature-body">
                <div className="tk-feature-meta">
                  <h3 className="tk-feature-title">{item.title}</h3>
                  <span
                    className="tk-feature-badge"
                    style={{ color: item.color, borderColor: `${item.color}44` }}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="tk-feature-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE BENTO GRID SHOWCASE */}
      <section className="tk-bento-section">
        <div className="tk-section-header">
          <span className="tk-section-tag">EXPERIENCE TALKIFY</span>
          <h2 className="tk-section-heading">Designed for Real Conversations</h2>
          <p className="tk-section-desc">
            Explore live video calling, waveform voice messages, squad rooms, and fast chat search.
          </p>
        </div>
        <div className="tk-bento-wrapper">
          <BentoGrid />
        </div>
      </section>

      {/* 4. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="tk-steps-section">
        <div className="tk-section-header">
          <span className="tk-section-tag">HOW IT WORKS</span>
          <h2 className="tk-section-heading">Get Started in 3 Simple Steps</h2>
          <p className="tk-section-desc">
            No friction or complex setups. Jump into fast conversations immediately.
          </p>
        </div>

        <div className="tk-steps-grid">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="tk-step-card"
            >
              <div className="tk-step-number">{step.step}</div>
              <div className="tk-step-icon">
                <i className={step.icon}></i>
              </div>
              <h3 className="tk-step-title">{step.title}</h3>
              <p className="tk-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="tk-cta-section">
        <div className="tk-cta-card">
          <div className="tk-cta-glow"></div>
          <div className="tk-cta-content">
            <h2 className="tk-cta-title">
              {content.closerTitle}
            </h2>
            <p className="tk-cta-subtitle">
              {content.closerSubtitle}
            </p>
            <div className="tk-cta-btns">
              <button
                className="tk-btn-hero-primary tk-btn-large"
                onClick={() => navigate(isAuth ? "/chat" : "/register")}
              >
                <span>{isAuth ? "Start Chatting Now" : content.closerButtonText}</span>
                <i className="fa-solid fa-arrow-right tk-arrow-anim"></i>
              </button>
              {!isAuth && (
                <button
                  className="tk-btn-hero-secondary tk-btn-large"
                  onClick={() => navigate("/login")}
                >
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;