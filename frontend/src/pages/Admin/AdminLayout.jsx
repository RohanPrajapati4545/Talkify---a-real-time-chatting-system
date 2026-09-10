import React, { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import AdminSideBar from "../../components/AdminSideBar";
import AdminFooter from "./AdminFooter";
import { logout } from "../redux/AuthSlice";
import socket from "../../socket/Socket";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth > 992 : true
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const { user } = useSelector((state) => state.auth || {});
  const { siteName, siteLogoUrl } = useSelector((state) => state.brand || {});
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Keep sidebar open on desktop, handle screen resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setSidebarOpen(true);
      }
    };
    if (window.innerWidth > 992) {
      setSidebarOpen(true);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar on route change only on mobile
  useEffect(() => {
    if (window.innerWidth <= 992) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowProfileMenu(false);
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to end your admin session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      confirmButtonColor: "#ef4444",
      background: "#0d1217",
      color: "#f8fafc",
    }).then((result) => {
      if (result.isConfirmed) {
        if (user?._id) {
          socket.emit("userOffline", user._id);
        }
        dispatch(logout());
        navigate("/login");
      }
    });
  };

  const getInitials = (name) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="tk-admin-app">
      {/* 1. TOP NAVBAR */}
      <header className="tk-admin-topbar">
        <div className="tk-admin-topbar-left">
          {/* Desktop Sidebar Toggle Button */}
          <button
            className="tk-admin-hamburger tk-admin-desktop-hamburger d-none d-lg-flex"
            type="button"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <i className={`fa-solid ${sidebarOpen ? "fa-bars-staggered" : "fa-bars"}`}></i>
          </button>

          {/* Admin Brand & Logo */}
          <div className="tk-admin-brand-card" onClick={() => navigate("/admin")}>
            <div className="tk-admin-avatar-square">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={siteName || "Talkify"} className="tk-admin-logo-img" />
              ) : (
                <span>{getInitials(user?.name || siteName || "T")}</span>
              )}
            </div>
            <div className="tk-admin-brand-info">
              <h4 className="tk-admin-brand-name">{siteName || "Talkify"} <span className="text-emerald">Admin</span></h4>
              <p className="tk-admin-brand-sub d-none d-sm-block">Real-Time Management</p>
            </div>
          </div>
        </div>

        <div className="tk-admin-topbar-right">
          {/* Live System Status Pill (Desktop only) */}
          <div className="tk-admin-status-pill d-none d-lg-flex">
            <span className="tk-admin-status-dot"></span>
            <span>Live Mesh</span>
          </div>

          {/* Notification Bell (Desktop only) */}
          <div className="tk-admin-notif-wrap d-none d-lg-block" ref={notificationsRef}>
            <button
              className="tk-admin-icon-btn"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              title="Notifications"
            >
              <i className="fa-regular fa-bell"></i>
              <span className="tk-admin-notif-badge">3</span>
            </button>

            {notificationsOpen && (
              <div className="tk-admin-dropdown tk-notif-dropdown">
                <div className="tk-dropdown-header">
                  <h6>System Alerts</h6>
                  <span className="badge bg-success">Live</span>
                </div>
                <div className="tk-dropdown-item">
                  <i className="fa-solid fa-bolt text-success me-2"></i>
                  <div>
                    <p className="mb-0 fw-semibold">Socket.IO Mesh Synchronized</p>
                    <small className="text-muted">Zero packet loss</small>
                  </div>
                </div>
                <div className="tk-dropdown-item">
                  <i className="fa-solid fa-user-plus text-info me-2"></i>
                  <div>
                    <p className="mb-0 fw-semibold">New User Registered</p>
                    <small className="text-muted">Just now</small>
                  </div>
                </div>
                <div className="tk-dropdown-item">
                  <i className="fa-solid fa-video text-warning me-2"></i>
                  <div>
                    <p className="mb-0 fw-semibold">WebRTC TURN Relay Active</p>
                    <small className="text-muted">All media streams operational</small>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Pill (Desktop only) */}
          <div className="tk-admin-profile-wrap d-none d-lg-block" ref={profileMenuRef}>
            <div
              className="tk-admin-profile-pill"
              onClick={() => setShowProfileMenu((prev) => !prev)}
            >
              <img
                src={
                  user?.image ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                }
                alt={user?.name || "Admin"}
                className="tk-admin-profile-avatar"
              />
              <span className="tk-admin-profile-name">
                {user?.name?.split(" ")[0] || "Admin"}
              </span>
              <i className={`fa-solid fa-chevron-down tk-admin-chevron ${showProfileMenu ? "rotate" : ""}`}></i>
            </div>

            {showProfileMenu && (
              <div className="tk-admin-dropdown tk-profile-dropdown">
                <div className="tk-dropdown-profile-header">
                  <img
                    src={
                      user?.image ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    }
                    alt=""
                    className="tk-dropdown-avatar"
                  />
                  <div>
                    <div className="fw-bold">{user?.name || "Admin User"}</div>
                    <small className="text-muted">{user?.email || "admin@talkify.com"}</small>
                  </div>
                </div>
                <div className="tk-dropdown-divider"></div>
                <button
                  className="tk-dropdown-link"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/admin/profile");
                  }}
                >
                  <i className="fa-solid fa-user-gear"></i>
                  <span>Admin Profile</span>
                </button>
                <button
                  className="tk-dropdown-link"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/admin/settings");
                  }}
                >
                  <i className="fa-solid fa-sliders"></i>
                  <span>System Settings</span>
                </button>
                <button
                  className="tk-dropdown-link"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/chat");
                  }}
                >
                  <i className="fa-solid fa-comments"></i>
                  <span>Launch Chat App</span>
                </button>
                <button
                  className="tk-dropdown-link"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/");
                  }}
                >
                  <i className="fa-solid fa-house"></i>
                  <span>View Landing Page</span>
                </button>
                <div className="tk-dropdown-divider"></div>
                <button className="tk-dropdown-link text-danger" onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation Drawer Toggle on Far Right */}
          <button
            className="tk-admin-hamburger d-lg-none"
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle Navigation Drawer"
            title="Toggle Navigation"
          >
            <i className={`fa-solid ${sidebarOpen ? "fa-xmark" : "fa-bars"}`}></i>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN CONTENT */}
      <div className="tk-admin-body">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="tk-admin-backdrop d-lg-none" onClick={toggleSidebar}></div>
        )}

        {/* Sidebar Wrapper */}
        <aside className={`tk-admin-sidebar-container ${sidebarOpen ? "expanded" : "collapsed"}`}>
          <AdminSideBar
            onClose={() => {
              if (window.innerWidth <= 992) {
                setSidebarOpen(false);
              }
            }}
          />
        </aside>

        {/* Main Content Area */}
        <main className={`tk-admin-main-content ${sidebarOpen ? "" : "full-width"}`}>
          <div className="tk-admin-content-inner">
            <Outlet />
          </div>
          <AdminFooter />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;