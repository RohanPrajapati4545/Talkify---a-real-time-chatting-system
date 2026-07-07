import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const useCountUp = (target, duration, start) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    const isPercent = typeof target === "string" && target.includes("%");
    const isPlus = typeof target === "string" && target.includes("+");
    const numeric = parseFloat(target);

    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numeric * eased;

      if (isPercent) {
        setValue(current.toFixed(1) + "%");
      } else if (numeric >= 1000000) {
        setValue((current / 1000000).toFixed(current >= 1000000 ? 1 : 0) + "M" + (isPlus ? "+" : ""));
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
  const revealRefs = useRef([]);
  const statsRef = useRef(null);
  const [statsInView, setStatsInView] = useState(false);

  const threads = useCountUp("10000+", 1400, statsInView);
  const messages = useCountUp("2000000+", 1600, statsInView);
  const uptime = useCountUp("99.9%", 1400, statsInView);

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

    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsInView(true);
            statsObserver.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    if (statsRef.current) statsObserver.observe(statsRef.current);

    return () => {
      observer.disconnect();
      statsObserver.disconnect();
    };
  }, []);

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="cv-about">
      <section className="cv-about-hero cv-reveal" ref={addRef}>
        <span className="cv-home-eyebrow cv-pulse-badge">
          <i className="fa-solid fa-file-lines"></i> ABOUT THE LINE
        </span>
        <h1 className="cv-about-title">
          Built for conversations,
          <br />
          <span className="cv-gradient-text">not for feeds.</span>
        </h1>
        <p className="cv-about-lede">
          Talkify started as a simple question: why does chatting with people
          you actually know keep feeling like scrolling a timeline? We stripped
          it back to what a message line is supposed to be — fast, direct, and
          yours.
        </p>
      </section>

      <section className="cv-about-timeline">
        <h2 className="cv-about-section-title cv-reveal" ref={addRef}>
          The dispatch log
        </h2>

        <div className="cv-about-tl-list">
          <div className="cv-about-tl-row cv-reveal cv-reveal-left cv-reveal-delay-1" ref={addRef}>
            <span className="cv-about-tl-stamp">ENTRY 01 · DAY ONE</span>
            <div className="cv-about-tl-body">
              <h3>A one-to-one prototype</h3>
              <p>The first version was just two people and a socket connection — no groups, no media, just messages arriving instantly.</p>
            </div>
          </div>

          <div className="cv-about-tl-row cv-reveal cv-reveal-left cv-reveal-delay-2" ref={addRef}>
            <span className="cv-about-tl-stamp">ENTRY 02 · GROUPS</span>
            <div className="cv-about-tl-body">
              <h3>Threads that scale</h3>
              <p>We added invite codes, admins, and member controls so a thread could hold a real group without turning into chaos.</p>
            </div>
          </div>

          <div className="cv-about-tl-row cv-reveal cv-reveal-left cv-reveal-delay-3" ref={addRef}>
            <span className="cv-about-tl-stamp">ENTRY 03 · SIGNAL</span>
            <div className="cv-about-tl-body">
              <h3>Read receipts, replies, edits</h3>
              <p>Small signals — sent, delivered, seen — so you always know where a conversation actually stands.</p>
            </div>
          </div>

          <div className="cv-about-tl-row cv-reveal cv-reveal-left cv-reveal-delay-4" ref={addRef}>
            <span className="cv-about-tl-stamp">ENTRY 04 · TODAY</span>
            <div className="cv-about-tl-body">
              <h3>One line, kept simple</h3>
              <p>Every feature since has had to earn its place. If it doesn't make a conversation easier, it doesn't ship.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-about-values">
        <h2 className="cv-about-section-title cv-reveal" ref={addRef}>
          What the line runs on
        </h2>
        <div className="cv-about-values-grid">
          <div className="cv-about-value-card cv-reveal cv-reveal-up cv-reveal-delay-1" ref={addRef}>
            <i className="fa-solid fa-bolt"></i>
            <h3>Speed over spectacle</h3>
            <p>Real-time means real-time. No spinners pretending to be instant.</p>
          </div>
          <div className="cv-about-value-card cv-reveal cv-reveal-up cv-reveal-delay-2" ref={addRef}>
            <i className="fa-solid fa-lock"></i>
            <h3>Your thread, your rules</h3>
            <p>Block, leave, or lock a group down — control stays with the people in it.</p>
          </div>
          <div className="cv-about-value-card cv-reveal cv-reveal-up cv-reveal-delay-3" ref={addRef}>
            <i className="fa-solid fa-feather"></i>
            <h3>Quiet by design</h3>
            <p>No algorithmic feed, no engagement bait. Just the people you talk to.</p>
          </div>
        </div>
      </section>

      <section className="cv-about-stats" ref={statsRef}>
        <div className="cv-about-stat cv-reveal cv-reveal-up cv-reveal-delay-1" ref={addRef}>
          <span className="cv-about-stat-num">{threads || "0"}</span>
          <span className="cv-about-stat-label">Active Threads</span>
        </div>
        <div className="cv-about-stat cv-reveal cv-reveal-up cv-reveal-delay-2" ref={addRef}>
          <span className="cv-about-stat-num">{messages || "0"}</span>
          <span className="cv-about-stat-label">Messages Sent</span>
        </div>
        <div className="cv-about-stat cv-reveal cv-reveal-up cv-reveal-delay-3" ref={addRef}>
          <span className="cv-about-stat-num">{uptime || "0"}</span>
          <span className="cv-about-stat-label">Uptime</span>
        </div>
      </section>

      <section className="cv-home-closer cv-reveal" ref={addRef}>
        <h2>Ready to open your own line?</h2>
        <p>It takes less than a minute to send your first message.</p>
        <button className="cv-btn-primary cv-home-cta cv-cta-shine" onClick={() => navigate("/register")}>
          Get Started <i className="fa-solid fa-arrow-right cv-cta-arrow"></i>
        </button>
      </section>
    </div>
  );
};

export default About;