import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const revealRefs = useRef([]);

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

  return (
    <div className="cv-home">
      <section className="cv-home-hero">
        <div className="cv-home-hero-copy cv-reveal cv-reveal-left" ref={addRef}>
          <span className="cv-home-eyebrow cv-pulse-badge">
            <i className="fa-solid fa-satellite-dish"></i> LIVE DISPATCH · NO. 001
          </span>
          <h1 className="cv-home-title">
            Every message,
            <br />
            <span className="cv-gradient-text">delivered the moment it's sent.</span>
          </h1>
          <p className="cv-home-subtitle">
            Talkify is a real-time messaging line for the people you actually
            talk to — one-on-one or in a group, with read receipts, replies,
            and media, minus the noise.
          </p>
          <div className="cv-home-cta-row">
            <button className="cv-btn-primary cv-home-cta cv-cta-shine" onClick={() => navigate("/register")}>
              Start Talking <i className="fa-solid fa-arrow-right cv-cta-arrow"></i>
            </button>
            <button className="cv-btn-ghost cv-home-cta-ghost" onClick={() => navigate("/login")}>
              I already have an account
            </button>
          </div>
        </div>

        <div className="cv-home-wire cv-reveal cv-reveal-right cv-float" ref={addRef}>
          <div className="cv-home-wire-head">
            <span>THREAD — "DESIGN CREW"</span>
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
          The dispatch, entry by entry
        </h2>
        <div className="cv-home-log-grid">
          <div className="cv-home-log-entry cv-reveal cv-reveal-up cv-reveal-delay-1" ref={addRef}>
            <span className="cv-home-log-num">ENTRY / 01</span>
            <i className="fa-solid fa-bolt"></i>
            <h3>Real-time, always</h3>
            <p>Messages land the instant they're sent — no refresh, no lag, no waiting on the wire.</p>
          </div>
          <div className="cv-home-log-entry cv-reveal cv-reveal-up cv-reveal-delay-2" ref={addRef}>
            <span className="cv-home-log-num">ENTRY / 02</span>
            <i className="fa-solid fa-users"></i>
            <h3>Groups that hold up</h3>
            <p>Invite codes, admins, and member controls built for threads that actually get busy.</p>
          </div>
          <div className="cv-home-log-entry cv-reveal cv-reveal-up cv-reveal-delay-3" ref={addRef}>
            <span className="cv-home-log-num">ENTRY / 03</span>
            <i className="fa-solid fa-check-double"></i>
            <h3>Know where you stand</h3>
            <p>Sent, delivered, seen. Replies and edits stay attached to the message they belong to.</p>
          </div>
          <div className="cv-home-log-entry cv-reveal cv-reveal-up cv-reveal-delay-4" ref={addRef}>
            <span className="cv-home-log-num">ENTRY / 04</span>
            <i className="fa-solid fa-image"></i>
            <h3>Media, handled well</h3>
            <p>Drop in photos and files without losing the thread of the conversation around them.</p>
          </div>
        </div>
      </section>

      <section className="cv-home-closer cv-reveal" ref={addRef}>
        <h2>Your line is open.</h2>
        <p>Create an account and send your first dispatch in under a minute.</p>
        <button className="cv-btn-primary cv-home-cta cv-cta-shine" onClick={() => navigate("/register")}>
          Create Account
        </button>
      </section>
    </div>
  );
};

export default Home;