import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout } from "./../pages/redux/AuthSlice";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";

const AdminSideBar = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [cmsOpen, setCmsOpen] = useState(
    location.pathname.includes("content")
  );
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.includes("setting")
  );

  const { user } = useSelector((state) => state.auth || {});
  const { siteName } = useSelector((state) => state.brand || {});

  const handleLogout = () => {
    if (onClose) onClose();
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to end your admin session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      confirmButtonColor: "#ef4444",
      allowOutsideClick: true,
      allowEscapeKey: true,
      background: "#0d1217",
      color: "#f8fafc",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(logout());
        navigate("/login");
      }
    });
  };

  const handleItemClick = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 992 && onClose) {
      onClose();
    }
  };

  return (
    <div className="tk-sidebar">
      {/* Mobile Drawer Admin Profile Card Header */}
      <div className="tk-admin-drawer-header d-lg-none">
        <div
          className="tk-admin-drawer-user"
          onClick={() => {
            handleItemClick();
            navigate("/admin/profile");
          }}
          title="Go to Admin Profile"
        >
          <div className="tk-admin-drawer-avatar-wrap">
            <img
              src={
                user?.image ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              }
              alt={user?.name || "Admin"}
              className="tk-admin-drawer-avatar"
            />
            <span className="tk-admin-drawer-online-dot"></span>
          </div>
          <div className="tk-admin-drawer-user-info">
            <h6 className="tk-admin-drawer-name">{user?.name || "Administrator"}</h6>
            <div className="tk-admin-drawer-badge-row">
              <span className="tk-admin-role-tag">Admin</span>
              <span className="tk-admin-live-tag">
                <span className="tk-admin-live-dot"></span> Live
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="tk-admin-drawer-close"
          onClick={onClose}
          aria-label="Close Navigation Drawer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* NAVIGATION TREE MENU */}
      <div className="tk-sidebar-menu">
        {/* Dashboard Link */}
        <NavLink
          to="/admin"
          end
          onClick={handleItemClick}
          className={({ isActive }) =>
            `tk-sidebar-item tk-sidebar-pill-main ${isActive ? "active" : ""}`
          }
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-solid fa-table-cells-large"></i>
            <span>Dashboard</span>
          </div>
        </NavLink>

        {/* Users Management */}
        <NavLink
          to="/admin/all-users"
          onClick={handleItemClick}
          className={({ isActive }) =>
            `tk-sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-regular fa-id-badge"></i>
            <span>Users</span>
          </div>
          <i className="fa-solid fa-chevron-right tk-arrow-sub"></i>
        </NavLink>

        {/* Squads & Groups */}
        <NavLink
          to="/admin/all-groups"
          onClick={handleItemClick}
          className={({ isActive }) =>
            `tk-sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-solid fa-users-viewfinder"></i>
            <span>Squads &amp; Groups</span>
          </div>
          <i className="fa-solid fa-chevron-right tk-arrow-sub"></i>
        </NavLink>

        {/* Chat Monitor */}
        <NavLink
          to="/admin/chat-monitor"
          onClick={handleItemClick}
          className={({ isActive }) =>
            `tk-sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-regular fa-comment-dots"></i>
            <span>Chat Monitor</span>
          </div>
          <i className="fa-solid fa-chevron-right tk-arrow-sub"></i>
        </NavLink>

        {/* Call Records */}
        <NavLink
          to="/admin/call-records"
          onClick={handleItemClick}
          className={({ isActive }) =>
            `tk-sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-solid fa-phone-volume"></i>
            <span>Call Records</span>
          </div>
          <i className="fa-solid fa-chevron-right tk-arrow-sub"></i>
        </NavLink>

        {/* Contact Us Queries */}
        <NavLink
          to="/admin/contact-queries"
          onClick={handleItemClick}
          className={({ isActive }) =>
            `tk-sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-regular fa-envelope"></i>
            <span>Inquiries &amp; Feedback</span>
          </div>
          <i className="fa-solid fa-chevron-right tk-arrow-sub"></i>
        </NavLink>

        {/* CMS Pages (Collapsible Tree) */}
        <div className="tk-sidebar-group">
          <div
            className={`tk-sidebar-item tk-group-toggle ${cmsOpen ? "open" : ""}`}
            onClick={() => setCmsOpen((prev) => !prev)}
          >
            <div className="tk-sidebar-item-left">
              <i className="fa-solid fa-pen-ruler"></i>
              <span>CMS Content</span>
            </div>
            <i className={`fa-solid fa-chevron-down tk-arrow-sub ${cmsOpen ? "rotate" : ""}`}></i>
          </div>

          {cmsOpen && (
            <div className="tk-sub-tree">
              <NavLink
                to="/admin/home-content"
                onClick={handleItemClick}
                className={({ isActive }) =>
                  `tk-sub-item ${isActive ? "active" : ""}`
                }
              >
                <span className="tk-tree-branch"></span>
                <span>Home Page Editor</span>
              </NavLink>

              <NavLink
                to="/admin/about-content"
                onClick={handleItemClick}
                className={({ isActive }) =>
                  `tk-sub-item ${isActive ? "active" : ""}`
                }
              >
                <span className="tk-tree-branch"></span>
                <span>About Page Editor</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Settings (Collapsible Tree) */}
        <div className="tk-sidebar-group">
          <div
            className={`tk-sidebar-item tk-group-toggle ${settingsOpen ? "open" : ""}`}
            onClick={() => setSettingsOpen((prev) => !prev)}
          >
            <div className="tk-sidebar-item-left">
              <i className="fa-solid fa-gear"></i>
              <span>System Settings</span>
            </div>
            <i className={`fa-solid fa-chevron-down tk-arrow-sub ${settingsOpen ? "rotate" : ""}`}></i>
          </div>

          {settingsOpen && (
            <div className="tk-sub-tree">
              <NavLink
                to="/admin/auth-setting"
                onClick={handleItemClick}
                className={({ isActive }) =>
                  `tk-sub-item ${isActive ? "active" : ""}`
                }
              >
                <span className="tk-tree-branch"></span>
                <span>Auth &amp; Security</span>
              </NavLink>

              <NavLink
                to="/admin/settings"
                onClick={handleItemClick}
                className={({ isActive }) =>
                  `tk-sub-item ${isActive ? "active" : ""}`
                }
              >
                <span className="tk-tree-branch"></span>
                <span>Brand &amp; Logo</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="tk-sidebar-divider"></div>

        {/* Shortcuts for Mobile */}
        <button
          type="button"
          className="tk-sidebar-item"
          onClick={() => {
            handleItemClick();
            navigate("/chat");
          }}
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-solid fa-comments text-emerald"></i>
            <span>Launch Chat App</span>
          </div>
        </button>

        <button
          type="button"
          className="tk-sidebar-item"
          onClick={() => {
            handleItemClick();
            navigate("/");
          }}
        >
          <div className="tk-sidebar-item-left">
            <i className="fa-solid fa-house text-cyan"></i>
            <span>View Landing Page</span>
          </div>
        </button>

        {/* Logout Link */}
        <button type="button" className="tk-sidebar-item tk-logout-btn" onClick={handleLogout}>
          <div className="tk-sidebar-item-left">
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </div>
        </button>
      </div>

      {/* BOTTOM INFO PROMO CARD (MATCHING REFERENCE DESIGN) */}
      <div className="tk-sidebar-promo-card">
        <div className="tk-promo-icon-box">
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <h5 className="tk-promo-title">{siteName || "Talkify"} Management</h5>
        <p className="tk-promo-desc">
          Real-time communication, squad channels &amp; moderation engine.
        </p>
      </div>
    </div>
  );
};

export default AdminSideBar;