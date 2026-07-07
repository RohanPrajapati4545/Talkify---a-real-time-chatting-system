import React from "react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="cv-about">
      {/* ============== INTRO ============== */}
      <section className="cv-about-hero">
        <span className="cv-home-eyebrow">
          <i className="fa-solid fa-file-lines"></i> ABOUT THE LINE
        </span>
        <h1 className="cv-about-title">
          Built for conversations,
          <br />
          <span>not for feeds.</span>
        </h1>
        <p className="cv-about-lede">
          Talkify started as a simple question: why does chatting with people
          you actually know keep feeling like scrolling a timeline? We stripped
          it back to what a message line is supposed to be — fast, direct, and
          yours.
        </p>
      </section>

      {/* ============== TIMELINE (real chronology, so numbering earns its place) ============== */}
      <section className="cv-about-timeline">
        <h2 className="cv-about-section-title">The dispatch log</h2>

        <div className="cv-about-tl-list">
          <div className="cv-about-tl-row">
            <span className="cv-about-tl-stamp">ENTRY 01 · DAY ONE</span>
            <div className="cv-about-tl-body">
              <h3>A one-to-one prototype</h3>
              <p>The first version was just two people and a socket connection — no groups, no media, just messages arriving instantly.</p>
            </div>
          </div>

          <div className="cv-about-tl-row">
            <span className="cv-about-tl-stamp">ENTRY 02 · GROUPS</span>
            <div className="cv-about-tl-body">
              <h3>Threads that scale</h3>
              <p>We added invite codes, admins, and member controls so a thread could hold a real group without turning into chaos.</p>
            </div>
          </div>

          <div className="cv-about-tl-row">
            <span className="cv-about-tl-stamp">ENTRY 03 · SIGNAL</span>
            <div className="cv-about-tl-body">
              <h3>Read receipts, replies, edits</h3>
              <p>Small signals — sent, delivered, seen — so you always know where a conversation actually stands.</p>
            </div>
          </div>

          <div className="cv-about-tl-row">
            <span className="cv-about-tl-stamp">ENTRY 04 · TODAY</span>
            <div className="cv-about-tl-body">
              <h3>One line, kept simple</h3>
              <p>Every feature since has had to earn its place. If it doesn't make a conversation easier, it doesn't ship.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== VALUES ============== */}
      <section className="cv-about-values">
        <h2 className="cv-about-section-title">What the line runs on</h2>
        <div className="cv-about-values-grid">
          <div className="cv-about-value-card">
            <i className="fa-solid fa-bolt"></i>
            <h3>Speed over spectacle</h3>
            <p>Real-time means real-time. No spinners pretending to be instant.</p>
          </div>
          <div className="cv-about-value-card">
            <i className="fa-solid fa-lock"></i>
            <h3>Your thread, your rules</h3>
            <p>Block, leave, or lock a group down — control stays with the people in it.</p>
          </div>
          <div className="cv-about-value-card">
            <i className="fa-solid fa-feather"></i>
            <h3>Quiet by design</h3>
            <p>No algorithmic feed, no engagement bait. Just the people you talk to.</p>
          </div>
        </div>
      </section>

      {/* ============== STATS STRIP ============== */}
      <section className="cv-about-stats">
        <div className="cv-about-stat">
          <span className="cv-about-stat-num">10k+</span>
          <span className="cv-about-stat-label">Active Threads</span>
        </div>
        <div className="cv-about-stat">
          <span className="cv-about-stat-num">2M+</span>
          <span className="cv-about-stat-label">Messages Sent</span>
        </div>
        <div className="cv-about-stat">
          <span className="cv-about-stat-num">99.9%</span>
          <span className="cv-about-stat-label">Uptime</span>
        </div>
      </section>

      {/* ============== CLOSING CTA ============== */}
      <section className="cv-home-closer">
        <h2>Ready to open your own line?</h2>
        <p>It takes less than a minute to send your first message.</p>
        <button className="cv-btn-primary cv-home-cta" onClick={() => navigate("/register")}>
          Get Started
        </button>
      </section>
    </div>
  );
};

export default About;