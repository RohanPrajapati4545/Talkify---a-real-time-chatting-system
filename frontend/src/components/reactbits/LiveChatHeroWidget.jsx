import React, { useState, useEffect, useRef } from "react";

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "theirs",
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    text: "Welcome to Talkify! Real-time Socket.IO chat & WebRTC video streams are live.",
    time: "10:42 AM",
    status: "seen",
  },
  {
    id: 2,
    sender: "mine",
    name: "You",
    text: "Awesome! Zero-latency delivery, voice waveforms, and squad rooms are running smoothly. ⚡",
    time: "10:43 AM",
    status: "seen",
  },
  {
    id: 3,
    sender: "theirs",
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    isAudio: true,
    duration: "0:18",
    time: "10:44 AM",
    status: "seen",
  },
];

const LiveChatHeroWidget = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "mine",
      name: "You",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "seen",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate instant reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "theirs",
            name: "Alex Rivera",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            text: "Delivered in 12ms! Everything is fully in sync. 🚀",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "seen",
          },
        ]);
      }, 1200);
    }, 600);
  };

  return (
    <div className="tk-simple-chat-mockup">
      {/* Top Window Header */}
      <div className="tk-mockup-topbar">
        <div className="tk-mockup-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>

        <div className="tk-mockup-channel-badge">
          <span className="tk-beacon-dot"></span>
          <i className="fa-solid fa-users tk-icon-emerald me-1"></i>
          <span># Product Squad</span>
          <span className="tk-count-pill">8 online</span>
        </div>

        <div className="tk-mockup-actions">
          <button
            type="button"
            className={`tk-call-toggle-btn ${callActive ? "active" : ""}`}
            onClick={() => setCallActive((prev) => !prev)}
            title="Toggle Call Preview"
          >
            <i className="fa-solid fa-video"></i>
            <span>{callActive ? "HD Call 04:12" : "Start Call"}</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="tk-mockup-body" ref={chatBodyRef}>
        {messages.map((msg) => {
          const isMine = msg.sender === "mine";
          return (
            <div key={msg.id} className={`tk-chat-row ${isMine ? "mine" : "theirs"}`}>
              {!isMine && (
                <img src={msg.avatar} alt="" className="tk-chat-avatar" />
              )}

              <div className={`tk-chat-bubble ${isMine ? "mine" : "theirs"}`}>
                {!isMine && <div className="tk-bubble-author">{msg.name}</div>}

                {msg.isAudio ? (
                  <div className="tk-voice-player">
                    <button
                      type="button"
                      className="tk-voice-play-circle"
                      onClick={() => setIsPlayingAudio((prev) => !prev)}
                    >
                      <i className={`fa-solid ${isPlayingAudio ? "fa-pause" : "fa-play"}`}></i>
                    </button>
                    <div className="tk-waveform-bars">
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "45%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "85%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "60%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "100%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "70%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "40%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "90%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "65%" }}></span>
                      <span className={`bar ${isPlayingAudio ? "anim" : ""}`} style={{ height: "35%" }}></span>
                    </div>
                    <span className="tk-voice-duration">{msg.duration}</span>
                  </div>
                ) : (
                  <div className="tk-bubble-text">{msg.text}</div>
                )}

                <div className="tk-bubble-time">
                  <span>{msg.time}</span>
                  {isMine && <i className="fa-solid fa-check-double tk-tick-cyan ms-1"></i>}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="tk-chat-row theirs">
            <div className="tk-chat-bubble theirs tk-typing-bubble">
              <span className="tk-typing-dot"></span>
              <span className="tk-typing-dot"></span>
              <span className="tk-typing-dot"></span>
              <span className="tk-typing-text">Alex is typing…</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Bottom Input Bar */}
      <form className="tk-mockup-input-bar" onSubmit={handleSendMessage}>
        <div className="tk-input-icons-left">
          <button type="button" className="tk-input-icon-btn" title="Emoji">
            <i className="fa-regular fa-face-smile"></i>
          </button>
          <button type="button" className="tk-input-icon-btn" title="Attach Media">
            <i className="fa-solid fa-paperclip"></i>
          </button>
        </div>

        <input
          type="text"
          className="tk-chat-input-field"
          placeholder="Type a message or press Enter to test live chat…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <button type="submit" className="tk-send-btn" title="Send Message">
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default LiveChatHeroWidget;
