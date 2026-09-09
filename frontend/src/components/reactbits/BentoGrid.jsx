import React, { useState, useEffect } from "react";

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "theirs",
    author: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    text: "Hey! Are we jumping on the squad video call today? 🚀",
    time: "10:42 AM",
    type: "text",
    reactions: ["👍", "🔥"],
  },
  {
    id: 2,
    sender: "mine",
    text: "Yes! Joining with HD audio and screen share in 2 mins. ⚡",
    time: "10:43 AM",
    type: "text",
    status: "seen", // sent, delivered, seen
    reactions: ["❤️"],
  },
  {
    id: 3,
    sender: "theirs",
    author: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    text: "Audio Note",
    duration: "0:14",
    time: "10:44 AM",
    type: "voice",
  },
];

const BentoGrid = () => {
  // Call simulation states
  const [callMuted, setCallMuted] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [callSeconds, setCallSeconds] = useState(254);
  const [voicePlaying, setVoicePlaying] = useState(true);

  // Invite code copy state
  const [copiedCode, setCopiedCode] = useState(false);

  // Pin state
  const [pinnedActive, setPinnedActive] = useState(true);

  // Animated chat simulation step
  // 0 = Alex typing
  // 1 = Alex message in
  // 2 = You typing
  // 3 = Your message sent (single tick)
  // 4 = Delivered (double grey)
  // 5 = Seen (cyan glow) + Alex voice note arrives
  const [animStep, setAnimStep] = useState(5);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [interactiveInput, setInteractiveInput] = useState("");
  const [customMessages, setCustomMessages] = useState([]);

  // Auto-play animation cycle
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 6);
    }, 2600);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = () => {
    setCopiedCode(true);
    if (navigator?.clipboard) {
      navigator.clipboard.writeText("TLK-SQUAD-98");
    }
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleSendCustomMsg = (e) => {
    e?.preventDefault();
    if (!interactiveInput.trim()) return;
    setIsAutoPlaying(false);
    setCustomMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "mine",
        text: interactiveInput.trim(),
        time: "Just now",
        type: "text",
        status: "seen",
      },
    ]);
    setInteractiveInput("");
  };

  const handleQuickChip = (msg) => {
    setIsAutoPlaying(false);
    setCustomMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "mine",
        text: msg,
        time: "Just now",
        type: "text",
        status: "seen",
      },
    ]);
  };

  return (
    <div className="tk-bento-grid-wrapper">
      {/* 1. LARGE CARD: LIVE CHATTING ANIMATIONS & SEEN RECEIPTS */}
      <div className="tk-bento-box tk-bento-main">
        <div className="tk-bento-card-header">
          <div className="tk-bento-badge-group">
            <span className="tk-badge-pill emerald">
              <span className="tk-pulse-dot"></span>
              Live Chat Animation
            </span>
            <span className="tk-badge-pill cyan">
              <i className="fa-solid fa-bolt me-1"></i> Socket.IO Real-Time
            </span>
          </div>
          <button
            type="button"
            className="tk-sim-replay-btn"
            onClick={() => {
              setIsAutoPlaying(true);
              setCustomMessages([]);
              setAnimStep(0);
            }}
            title="Restart Animation Cycle"
          >
            <i className="fa-solid fa-rotate-right me-1"></i> Replay Flow
          </button>
        </div>

        <div className="tk-bento-text-block">
          <h3 className="tk-bento-title">Real-Time Messaging with Typing &amp; Seen Ticks</h3>
          <p className="tk-bento-desc">
            Experience ultra-smooth chat animations — from live bouncing typing bubbles to instant single tick, double tick, and glowing cyan read receipts.
          </p>
        </div>

        {/* The Animated Chat Console */}
        <div className="tk-chat-sim-stage">
          {/* Top header of simulated chat */}
          <div className="tk-chat-sim-header">
            <div className="tk-sim-user">
              <div className="tk-sim-avatar-wrap">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Alex"
                  className="tk-sim-user-avatar"
                />
                <span className="tk-user-online-dot"></span>
              </div>
              <div className="tk-sim-user-details">
                <span className="tk-sim-user-name">Alex Rivera</span>
                <span className="tk-sim-user-status">
                  {animStep === 0 ? "typing a message..." : "Active in Squad #general"}
                </span>
              </div>
            </div>

            <div className="tk-sim-header-actions">
              <span className="tk-sim-latency-tag">
                <i className="fa-solid fa-signal me-1"></i> 14ms
              </span>
            </div>
          </div>

          {/* Animated Message Stream */}
          <div className="tk-chat-sim-feed">
            {/* Alex's first message */}
            {(animStep >= 1 || !isAutoPlaying) && (
              <div className="tk-sim-msg-row theirs tk-sim-appear">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt=""
                  className="tk-sim-msg-avatar"
                />
                <div className="tk-sim-bubble theirs">
                  <div className="tk-sim-bubble-author">Alex Rivera</div>
                  <div className="tk-sim-bubble-text">
                    Hey! Are we jumping on the squad video call today? 🚀
                  </div>
                  <div className="tk-sim-meta">
                    <span className="tk-sim-time">10:42 AM</span>
                  </div>
                  <div className="tk-sim-reactions">
                    <span className="tk-reaction-pill">🚀 1</span>
                    <span className="tk-reaction-pill">🔥 1</span>
                  </div>
                </div>
              </div>
            )}

            {/* Typing bubble when Alex is typing */}
            {animStep === 0 && isAutoPlaying && (
              <div className="tk-sim-msg-row theirs tk-sim-fade">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt=""
                  className="tk-sim-msg-avatar"
                />
                <div className="tk-sim-bubble theirs tk-sim-typing-bubble">
                  <div className="tk-bounce-dot-group">
                    <span className="tk-b-dot"></span>
                    <span className="tk-b-dot"></span>
                    <span className="tk-b-dot"></span>
                  </div>
                  <span className="tk-typing-hint">Alex is typing…</span>
                </div>
              </div>
            )}

            {/* You are typing indicator */}
            {animStep === 2 && isAutoPlaying && (
              <div className="tk-sim-msg-row mine tk-sim-fade">
                <div className="tk-sim-bubble mine tk-sim-typing-bubble">
                  <span className="tk-typing-hint">You are typing…</span>
                  <div className="tk-bounce-dot-group">
                    <span className="tk-b-dot"></span>
                    <span className="tk-b-dot"></span>
                    <span className="tk-b-dot"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Your animated reply with dynamic ticks */}
            {(animStep >= 3 || !isAutoPlaying) && (
              <div className="tk-sim-msg-row mine tk-sim-slide-up">
                <div className="tk-sim-bubble mine">
                  <div className="tk-sim-bubble-text">
                    Yes! Joining with HD audio and screen share in 2 mins. ⚡
                  </div>
                  <div className="tk-sim-meta mine">
                    <span className="tk-sim-time">10:43 AM</span>
                    {/* Step 3: Sent (Single Tick) */}
                    {animStep === 3 && isAutoPlaying && (
                      <span className="tk-tick tk-tick-sent" title="Sent">
                        <i className="fa-solid fa-check"></i>
                      </span>
                    )}
                    {/* Step 4: Delivered (Double Grey Tick) */}
                    {animStep === 4 && isAutoPlaying && (
                      <span className="tk-tick tk-tick-delivered" title="Delivered">
                        <i className="fa-solid fa-check-double"></i>
                      </span>
                    )}
                    {/* Step >= 5: Seen (Cyan Glowing Double Tick) */}
                    {(animStep >= 5 || !isAutoPlaying) && (
                      <span className="tk-tick tk-tick-seen" title="Seen by Alex">
                        <i className="fa-solid fa-check-double"></i>
                      </span>
                    )}
                  </div>
                  <div className="tk-sim-reactions mine">
                    <span className="tk-reaction-pill">❤️ 1</span>
                  </div>
                </div>
              </div>
            )}

            {/* Voice note message from Alex */}
            {(animStep >= 5 || !isAutoPlaying) && (
              <div className="tk-sim-msg-row theirs tk-sim-slide-up">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt=""
                  className="tk-sim-msg-avatar"
                />
                <div className="tk-sim-bubble theirs tk-sim-voice-bubble">
                  <button
                    type="button"
                    className="tk-voice-play-trigger"
                    onClick={() => setVoicePlaying((p) => !p)}
                    title={voicePlaying ? "Pause Audio" : "Play Audio"}
                  >
                    <i className={`fa-solid ${voicePlaying ? "fa-pause" : "fa-play"}`}></i>
                  </button>

                  <div className="tk-sim-wave-track">
                    {[40, 85, 60, 100, 75, 45, 90, 65, 30, 80, 95, 50, 70, 35].map(
                      (h, idx) => (
                        <span
                          key={idx}
                          className={`tk-wave-bar ${voicePlaying ? "dancing" : ""}`}
                          style={{
                            height: `${h}%`,
                            animationDelay: `${(idx % 4) * 0.15}s`,
                          }}
                        ></span>
                      )
                    )}
                  </div>

                  <span className="tk-voice-time-label">0:14</span>
                </div>
              </div>
            )}

            {/* Custom interactive messages from user clicks */}
            {customMessages.map((msg) => (
              <div key={msg.id} className="tk-sim-msg-row mine tk-sim-slide-up">
                <div className="tk-sim-bubble mine">
                  <div className="tk-sim-bubble-text">{msg.text}</div>
                  <div className="tk-sim-meta mine">
                    <span className="tk-sim-time">{msg.time}</span>
                    <span className="tk-tick tk-tick-seen">
                      <i className="fa-solid fa-check-double"></i>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick interactive test chips */}
          <div className="tk-chat-quick-chips">
            <span className="tk-chip-label">Try sending:</span>
            <button
              type="button"
              className="tk-sim-chip-btn"
              onClick={() => handleQuickChip("Awesome! See you in room #1 🔥")}
            >
              "Awesome! 🔥"
            </button>
            <button
              type="button"
              className="tk-sim-chip-btn"
              onClick={() => handleQuickChip("Shared the design mockups in chat! 🎨")}
            >
              "Shared designs! 🎨"
            </button>
            <button
              type="button"
              className="tk-sim-chip-btn"
              onClick={() => handleQuickChip("Can everyone hear my audio? 🎙️")}
            >
              "Audio check 🎙️"
            </button>
          </div>

          {/* Interactive Chat Input Bar */}
          <form className="tk-sim-composer" onSubmit={handleSendCustomMsg}>
            <div className="tk-sim-composer-actions">
              <button type="button" className="tk-sim-tool-btn" title="Attach file">
                <i className="fa-solid fa-paperclip"></i>
              </button>
              <button type="button" className="tk-sim-tool-btn" title="Record Voice">
                <i className="fa-solid fa-microphone"></i>
              </button>
            </div>
            <input
              type="text"
              className="tk-sim-input"
              placeholder="Type an interactive message..."
              value={interactiveInput}
              onChange={(e) => setInteractiveInput(e.target.value)}
            />
            <button type="submit" className="tk-sim-send-btn" title="Send">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>

        {/* 3-Step Live Status Progression */}
        <div className="tk-status-tracker-bar">
          <div className={`tk-tracker-step ${animStep >= 3 ? "active" : ""}`}>
            <span className="tk-tracker-icon">
              <i className="fa-solid fa-arrow-up"></i>
            </span>
            <div className="tk-tracker-info">
              <span className="tk-tracker-title">1. Instant Sent</span>
              <span className="tk-tracker-sub">Dispatched &lt; 5ms</span>
            </div>
          </div>

          <i className="fa-solid fa-chevron-right tk-tracker-arrow"></i>

          <div className={`tk-tracker-step ${animStep >= 4 ? "active" : ""}`}>
            <span className="tk-tracker-icon">
              <i className="fa-solid fa-check-double"></i>
            </span>
            <div className="tk-tracker-info">
              <span className="tk-tracker-title">2. Delivered</span>
              <span className="tk-tracker-sub">Socket received</span>
            </div>
          </div>

          <i className="fa-solid fa-chevron-right tk-tracker-arrow"></i>

          <div className={`tk-tracker-step ${animStep >= 5 ? "active seen" : ""}`}>
            <span className="tk-tracker-icon seen">
              <i className="fa-solid fa-check-double"></i>
            </span>
            <div className="tk-tracker-info">
              <span className="tk-tracker-title">3. Seen Receipt</span>
              <span className="tk-tracker-sub">Glowing cyan tick</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CARD: HD WEBRTC CALLING WIDGET */}
      <div className="tk-bento-box tk-bento-call">
        <div className="tk-bento-card-header">
          <span className="tk-badge-pill cyan">
            <i className="fa-solid fa-video me-1"></i> WebRTC 1080p
          </span>
          <span className="tk-live-call-pill">
            <span className="tk-live-pulse-dot"></span> LIVE CALL
          </span>
        </div>

        <div className="tk-bento-text-block">
          <h3 className="tk-bento-title">HD Video &amp; Voice Calls</h3>
          <p className="tk-bento-desc">
            Direct peer-to-peer audio/video with animated voice waveforms and quick toggles.
          </p>
        </div>

        {/* Interactive Call Card */}
        <div className="tk-call-widget-box">
          <div className="tk-call-avatar-container">
            <div className="tk-call-pulse-ring"></div>
            <div className="tk-call-pulse-ring-2"></div>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Alex Rivera"
              className="tk-call-main-avatar"
            />
            <span className="tk-call-status-badge">Speaking</span>
          </div>

          <div className="tk-call-speaker-meta">
            <h4 className="tk-call-speaker-name">Alex Rivera</h4>
            <span className="tk-call-duration-text">Connected · {formatCallTime(callSeconds)}</span>
          </div>

          {/* Animated Audio Equalizer */}
          <div className="tk-call-equalizer">
            <span className="eq-bar eq-1"></span>
            <span className="eq-bar eq-2"></span>
            <span className="eq-bar eq-3"></span>
            <span className="eq-bar eq-4"></span>
            <span className="eq-bar eq-5"></span>
            <span className="eq-bar eq-6"></span>
            <span className="eq-bar eq-7"></span>
          </div>

          {/* Interactive Call Action Controls */}
          <div className="tk-call-controls-row">
            <button
              type="button"
              className={`tk-call-circle-btn ${callMuted ? "muted" : "active"}`}
              onClick={() => setCallMuted((p) => !p)}
              title={callMuted ? "Unmute Mic" : "Mute Mic"}
            >
              <i className={`fa-solid ${callMuted ? "fa-microphone-slash" : "fa-microphone"}`}></i>
            </button>

            <button
              type="button"
              className={`tk-call-circle-btn ${cameraActive ? "active" : "muted"}`}
              onClick={() => setCameraActive((p) => !p)}
              title={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
            >
              <i className={`fa-solid ${cameraActive ? "fa-video" : "fa-video-slash"}`}></i>
            </button>

            <button
              type="button"
              className="tk-call-circle-btn end-call"
              onClick={() => {
                setCallMuted(false);
                setCameraActive(true);
                setCallSeconds(0);
              }}
              title="Reset Call"
            >
              <i className="fa-solid fa-phone-slash"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CARD: 1-CLICK SQUAD ROOM INVITES */}
      <div className="tk-bento-box tk-bento-invite">
        <div className="tk-bento-card-header">
          <span className="tk-badge-pill emerald">
            <i className="fa-solid fa-users me-1"></i> Squad Channels
          </span>
        </div>

        <div className="tk-bento-text-block">
          <h3 className="tk-bento-title">Instant Squad Invites</h3>
          <p className="tk-bento-desc">
            Invite teammates with a simple 6-character room code. One click to copy.
          </p>
        </div>

        {/* Clickable Code Showcase */}
        <div
          className={`tk-invite-interactive-card ${copiedCode ? "copied" : ""}`}
          onClick={handleCopyCode}
        >
          <div className="tk-invite-code-pill">
            <span className="tk-code-text">TLK-SQUAD-98</span>
            <button type="button" className="tk-code-copy-btn" title="Copy code">
              <i className={`fa-solid ${copiedCode ? "fa-check tk-icon-emerald" : "fa-copy"}`}></i>
            </button>
          </div>
          <span className="tk-invite-tooltip">
            {copiedCode ? "✓ Copied to clipboard!" : "Click anywhere to copy code"}
          </span>

          {/* Active Members Stack */}
          <div className="tk-squad-presence">
            <div className="tk-avatar-overlap-stack">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt=""
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                alt=""
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                alt=""
              />
              <span className="tk-stack-count">+8</span>
            </div>
            <span className="tk-presence-label">Squad members online right now</span>
          </div>
        </div>
      </div>

      {/* 4. CARD: PINNED ANNOUNCEMENTS & CONTROLS */}
      <div className="tk-bento-box tk-bento-pin">
        <div className="tk-bento-card-header">
          <span className="tk-badge-pill mint">
            <i className="fa-solid fa-thumbtack me-1"></i> Pinning System
          </span>
          <span className="tk-admin-badge-pill">Admin Controls</span>
        </div>

        <div className="tk-bento-text-block">
          <h3 className="tk-bento-title">Admin &amp; Chat Pinning</h3>
          <p className="tk-bento-desc">
            Keep critical group guidelines, sprint links, and announcements sticky at the top.
          </p>
        </div>

        {/* Pinned Banner Interactive */}
        <div
          className={`tk-pinned-card ${pinnedActive ? "active" : "unpinned"}`}
          onClick={() => setPinnedActive((p) => !p)}
        >
          <div className="tk-pin-icon-circle">
            <i className="fa-solid fa-thumbtack"></i>
          </div>
          <div className="tk-pinned-body">
            <div className="tk-pin-tag">PINNED NOTICE</div>
            <div className="tk-pin-message">
              Sprint demo at 4:00 PM · Squad code: <strong>TLK-SQUAD-98</strong>
            </div>
          </div>
          <button type="button" className="tk-pin-badge-action">
            {pinnedActive ? "Pinned ✓" : "Unpinned"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BentoGrid;
