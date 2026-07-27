import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminFooter = () => {
  const navigate = useNavigate();

  // site name/logo, kept in sync everywhere via the admin settings panel
  const { siteName, siteLogoUrl } = useSelector((state) => state.brand || {});

  const goTo = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <footer className="cv-footer">
      <div className="cv-footer-inner">

        <div className="cv-footer-col">
          <div
            className="cv-brand"
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => goTo("/admin")}
          >
            {siteLogoUrl ? (
              <img
                src={siteLogoUrl}
                alt={siteName}
                className="cv-brand-mark-logo"
                style={{ height: "28px", width: "28px", objectFit: "contain" }}
              />
            ) : null}
            <span className="cv-brand-mark" style={{ fontSize: "20px" }}>
              {siteName || "Talkify"}
            </span>
          </div>
          <span style={{ cursor: "default", fontSize: "12.5px", marginTop: "4px" }}>
            Real-time chat &amp; group messaging platform.
          </span>
        </div>

        <div className="cv-footer-col  ms-5">
          <span className="cv-footer-col-title">Quick Links</span>
          <span onClick={() => goTo("/admin")}>Dashboard</span>
          <span onClick={() => goTo("/admin/all-users")}>Users</span>
          <span onClick={() => goTo("/admin/all-groups")}>Groups</span>
        </div>

        <div className="cv-footer-col  ms-5">
          <span className="cv-footer-col-title">Manage</span>
          <span onClick={() => goTo("/admin/chat-monitor")}>Chat Monitor</span>
          <span onClick={() => goTo("/admin/call-records")}>Call Records</span>
          <span onClick={() => goTo("/admin/settings")}>Settings</span>
        </div>

        <div className="cv-footer-col  ms-5">
          <span className="cv-footer-col-title">System Status</span>

          <span style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "default" }}>
            <span className="cv-online-dot" style={{ position: "static", border: "none" }}></span>
            <span className="cv-online-text">Chat Server Online</span>
          </span>

          <span style={{ cursor: "default" }}>Admin Panel v1.0.0</span>
          <span style={{ cursor: "default" }}>
            Last sync: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

      </div>

      <div className="cv-footer-bottom">
        © {new Date().getFullYear()} {siteName || "Talkify"}. Admin Panel — All rights reserved.
      </div>
    </footer>
  );
};

export default AdminFooter;