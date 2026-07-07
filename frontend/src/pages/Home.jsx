import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="cv-home">
    
      <section className="cv-home-hero">
        <div className="cv-home-hero-copy">
          <span className="cv-home-eyebrow">
            <i className="fa-solid fa-satellite-dish"></i> LIVE DISPATCH · NO. 001
          </span>
          <h1 className="cv-home-title">
            Every message,
            <br />
            <span>delivered the moment it's sent.</span>
          </h1>
          <p className="cv-home-subtitle">
            Talkify is a real-time messaging line for the people you actually
            talk to — one-on-one or in a group, with read receipts, replies,
            and media, minus the noise.
          </p>
          <div className="cv-home-cta-row">
            <button className="cv-btn-primary cv-home-cta" onClick={() => navigate("/register")}>
              Start Talking <i className="fa-solid fa-arrow-right"></i>
            </button>
            <button className="cv-btn-ghost cv-home-cta-ghost" onClick={() => navigate("/login")}>
              I already have an account
            </button>
          </div>
        </div>

        <div className="cv-home-wire">
          <div className="cv-home-wire-head">
            <span>THREAD — “DESIGN CREW”</span>
            <span className="cv-online-text">● ONLINE</span>
          </div>
          <div className="cv-home-wire-body">
            <div className="cv-msg-row theirs">
              <div className="cv-bubble theirs">
                <div className="cv-sender">Rohan</div>
                Hi buddy! 
                <div className="cv-stamp"> 09:14</div>
              </div>
            </div>
            <div className="cv-msg-row mine">
              <div className="cv-bubble mine">
          hello
                <div className="cv-stamp">
                  09:15 <i className="fa-solid fa-check-double cv-tick-seen"></i>
                </div>
              </div>
            </div>
            <div className="cv-home-wire-typing">
              <span className="cv-typing-text">Rohan is typing…</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-home-log">
        <h2 className="cv-home-log-title">The dispatch, entry by entry</h2>
        <div className="cv-home-log-grid">
          <div className="cv-home-log-entry">
            <span className="cv-home-log-num">ENTRY / 01</span>
            <i className="fa-solid fa-bolt"></i>
            <h3>Real-time, always</h3>
            <p>Messages land the instant they're sent — no refresh, no lag, no waiting on the wire.</p>
          </div>
          <div className="cv-home-log-entry">
            <span className="cv-home-log-num">ENTRY / 02</span>
            <i className="fa-solid fa-users"></i>
            <h3>Groups that hold up</h3>
            <p>Invite codes, admins, and member controls built for threads that actually get busy.</p>
          </div>
          <div className="cv-home-log-entry">
            <span className="cv-home-log-num">ENTRY / 03</span>
            <i className="fa-solid fa-check-double"></i>
            <h3>Know where you stand</h3>
            <p>Sent, delivered, seen. Replies and edits stay attached to the message they belong to.</p>
          </div>
          <div className="cv-home-log-entry">
            <span className="cv-home-log-num">ENTRY / 04</span>
            <i className="fa-solid fa-image"></i>
            <h3>Media, handled well</h3>
            <p>Drop in photos and files without losing the thread of the conversation around them.</p>
          </div>
        </div>
      </section>
      <section className="cv-home-closer">
        <h2>Your line is open.</h2>
        <p>Create an account and send your first dispatch in under a minute.</p>
        <button className="cv-btn-primary cv-home-cta" onClick={() => navigate("/register")}>
          Create Account
        </button>
      </section>
    </div>
  );
};

export default Home;