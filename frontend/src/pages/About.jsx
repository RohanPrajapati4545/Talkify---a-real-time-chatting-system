import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Same values as the schema defaults on the backend — used only as a
// fallback so the page never looks broken while the fetch is in flight
// or if the API call fails for some reason.
const DEFAULT_CONTENT = {
  heroEyebrow: "ABOUT THE LINE",
  aboutTitleLine1: "Built for conversations,",
  aboutTitleLine2: "not for feeds.",
  aboutLede:
    "Talkify started as a simple question: why does chatting with people you actually know keep feeling like scrolling a timeline? We stripped it back to what a message line is supposed to be — fast, direct, and yours.",
  timelineSectionTitle: "The dispatch log",
  timelineEntries: [
    {
      stamp: "ENTRY 01 · DAY ONE",
      title: "A one-to-one prototype",
      description:
        "The first version was just two people and a socket connection — no groups, no media, just messages arriving instantly.",
    },
    {
      stamp: "ENTRY 02 · GROUPS",
      title: "Threads that scale",
      description:
        "We added invite codes, admins, and member controls so a thread could hold a real group without turning into chaos.",
    },
    {
      stamp: "ENTRY 03 · SIGNAL",
      title: "Read receipts, replies, edits",
      description:
        "Small signals — sent, delivered, seen — so you always know where a conversation actually stands.",
    },
    {
      stamp: "ENTRY 04 · TODAY",
      title: "One line, kept simple",
      description:
        "Every feature since has had to earn its place. If it doesn't make a conversation easier, it doesn't ship.",
    },
  ],
  valuesSectionTitle: "What the line runs on",
  valueCards: [
    {
      icon: "fa-solid fa-bolt",
      title: "Speed over spectacle",
      description: "Real-time means real-time. No spinners pretending to be instant.",
    },
    {
      icon: "fa-solid fa-lock",
      title: "Your thread, your rules",
      description: "Block, leave, or lock a group down — control stays with the people in it.",
    },
    {
      icon: "fa-solid fa-feather",
      title: "Quiet by design",
      description: "No algorithmic feed, no engagement bait. Just the people you talk to.",
    },
  ],
  statThreadsTarget: "10000+",
  statThreadsLabel: "Active Threads",
  statMessagesTarget: "2000000+",
  statMessagesLabel: "Messages Sent",
  statUptimeTarget: "99.9%",
  statUptimeLabel: "Uptime",
  closerTitle: "Ready to open your own line?",
  closerSubtitle: "It takes less than a minute to send your first message.",
  closerButtonText: "Get Started",
};

const useCountUp = (target, duration, start) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start || !target) return;

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
  const [content, setContent] = useState(DEFAULT_CONTENT);

  // Fetch the admin-editable content once on mount. Falls back silently
  // to DEFAULT_CONTENT if the request fails, so the page still renders.
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/content/about`);
        if (res.data?.content) {
          setContent(res.data.content);
        }
      } catch (error) {
        console.log("Failed to load about content, using defaults:", error);
      }
    };

    fetchContent();
  }, []);

  const threads = useCountUp(content.statThreadsTarget, 1400, statsInView);
  const messages = useCountUp(content.statMessagesTarget, 1600, statsInView);
  const uptime = useCountUp(content.statUptimeTarget, 1400, statsInView);

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
  }, [content]); // re-run so newly rendered cards/rows get observed too

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="cv-about">
      <section className="cv-about-hero cv-reveal" ref={addRef}>
        <span className="cv-home-eyebrow cv-pulse-badge">
          <i className="fa-solid fa-file-lines"></i> {content.heroEyebrow}
        </span>
        <h1 className="cv-about-title">
          {content.aboutTitleLine1}
          <br />
          <span className="cv-gradient-text">{content.aboutTitleLine2}</span>
        </h1>
        <p className="cv-about-lede">{content.aboutLede}</p>
      </section>

      <section className="cv-about-timeline">
        <h2 className="cv-about-section-title cv-reveal" ref={addRef}>
          {content.timelineSectionTitle}
        </h2>

        <div className="cv-about-tl-list">
          {content.timelineEntries.map((entry, index) => (
            <div
              key={index}
              className={`cv-about-tl-row cv-reveal cv-reveal-left cv-reveal-delay-${index + 1}`}
              ref={addRef}
            >
              <span className="cv-about-tl-stamp">{entry.stamp}</span>
              <div className="cv-about-tl-body">
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cv-about-values">
        <h2 className="cv-about-section-title cv-reveal" ref={addRef}>
          {content.valuesSectionTitle}
        </h2>
        <div className="cv-about-values-grid">
          {content.valueCards.map((card, index) => (
            <div
              key={index}
              className={`cv-about-value-card cv-reveal cv-reveal-up cv-reveal-delay-${index + 1}`}
              ref={addRef}
            >
              <i className={card.icon}></i>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cv-about-stats" ref={statsRef}>
        <div className="cv-about-stat cv-reveal cv-reveal-up cv-reveal-delay-1" ref={addRef}>
          <span className="cv-about-stat-num">{threads || "0"}</span>
          <span className="cv-about-stat-label">{content.statThreadsLabel}</span>
        </div>
        <div className="cv-about-stat cv-reveal cv-reveal-up cv-reveal-delay-2" ref={addRef}>
          <span className="cv-about-stat-num">{messages || "0"}</span>
          <span className="cv-about-stat-label">{content.statMessagesLabel}</span>
        </div>
        <div className="cv-about-stat cv-reveal cv-reveal-up cv-reveal-delay-3" ref={addRef}>
          <span className="cv-about-stat-num">{uptime || "0"}</span>
          <span className="cv-about-stat-label">{content.statUptimeLabel}</span>
        </div>
      </section>

      <section className="cv-home-closer cv-reveal" ref={addRef}>
        <h2>{content.closerTitle}</h2>
        <p>{content.closerSubtitle}</p>
        <button className="cv-btn-primary cv-home-cta cv-cta-shine" onClick={() => navigate("/register")}>
          {content.closerButtonText} <i className="fa-solid fa-arrow-right cv-cta-arrow"></i>
        </button>
      </section>
    </div>
  );
};

export default About;