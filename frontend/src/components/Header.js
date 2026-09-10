import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { logout } from "../pages/redux/AuthSlice";
import Loader from "./Loader";
import socket from "../socket/Socket";

const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [showMobileNav, setShowMobileNav] = useState(false);
  const mobileNavRef = useRef(null);

  const { token, user } = useSelector((state) => state.auth || {});
  const { siteName, siteLogoUrl } = useSelector((state) => state.brand || {});

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (
        mobileNavRef.current &&
        !mobileNavRef.current.contains(event.target) &&
        !event.target.closest(".rb-mobile-toggle")
      ) {
        setShowMobileNav(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (path) => {
    setShowMenu(false);
    setShowMobileNav(false);
    navigate(path);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    setShowMenu(false);
    setShowMobileNav(false);

    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to end your session?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Logout",
      confirmButtonColor: "#ef4444",
      background: "#0e1326",
      color: "#f8fafc",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        if (user?._id) {
          socket.emit("userOffline", user._id);
        }
        dispatch(logout());
        navigate("/");
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        setLoading(false);
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {loading && <Loader />}

      <header className={`rb-header ${scrolled ? "rb-header-scrolled" : ""}`}>
        <div className="rb-header-inner">
          {/* Brand Logo */}
          <div className="rb-header-brand" onClick={() => goTo("/")}>
            <div className="rb-brand-icon-box">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={siteName || "Talkify"} className="rb-brand-img" />
              ) : (
                <i className="fa-solid fa-comments rb-brand-icon"></i>
              )}
            </div>
            <span className="rb-brand-name">
              <span className="rb-brand-part-1">Talk</span>
              <span className="rb-brand-part-2">ify</span>
              <span className="rb-brand-dot"></span>
            </span>
          </div>

          {/* Desktop Nav & Actions */}
          <div className="rb-header-right">
            <nav className="rb-header-nav">
              <span
                className={`rb-header-link ${isActive("/") ? "active" : ""}`}
                onClick={() => goTo("/")}
              >
                Home
              </span>

              <span
                className={`rb-header-link ${isActive("/about") ? "active" : ""}`}
                onClick={() => goTo("/about")}
              >
                About
              </span>

              <span
                className={`rb-header-link ${isActive("/contact") ? "active" : ""}`}
                onClick={() => goTo("/contact")}
              >
                Contact
              </span>

              {token && (
                <span
                  className={`rb-header-link ${isActive("/chat") ? "active" : ""}`}
                  onClick={() => goTo("/chat")}
                >
                  <i className="fa-solid fa-bolt me-1 text-teal"></i> Messages
                </span>
              )}
            </nav>

            <div className="rb-header-actions" ref={menuRef}>
              {token ? (
                <div
                  className="rb-header-profile-btn"
                  onClick={() => setShowMenu((prev) => !prev)}
                >
                  <div className="rb-avatar-ring">
                    {user?.image ? (
                      <img src={user.image} alt={user?.name || "User"} className="rb-header-avatar" />
                    ) : (
                      <i className="fa-solid fa-user"></i>
                    )}
                    <span className="rb-avatar-online-dot"></span>
                  </div>
                  <span className="rb-header-user-name">{user?.name?.split(" ")[0] || "Account"}</span>
                  <i className={`fa-solid fa-chevron-down rb-chevron ${showMenu ? "open" : ""}`}></i>
                </div>
              ) : (
                <div className="rb-auth-buttons">
                  <button
                    className="rb-btn-ghost"
                    onClick={() => goTo("/login")}
                  >
                    Log in
                  </button>
                  <button
                    className="rb-btn-primary"
                    onClick={() => goTo("/register")}
                  >
                    Get Started
                  </button>
                </div>
              )}

              {token && showMenu && (
                <div className="rb-header-dropdown">
                  <div className="rb-dropdown-header">
                    <span className="rb-dropdown-name">{user?.name || "User"}</span>
                    <span className="rb-dropdown-email">{user?.email}</span>
                  </div>
                  <div className="rb-dropdown-divider"></div>
                  <div className="rb-dropdown-item" onClick={() => goTo("/chat")}>
                    <i className="fa-solid fa-comments"></i>
                    <span>Messages</span>
                  </div>
                  <div className="rb-dropdown-item" onClick={() => goTo("/profile")}>
                    <i className="fa-solid fa-user-gear"></i>
                    <span>Profile Settings</span>
                  </div>
                  <div className="rb-dropdown-divider"></div>
                  <div className="rb-dropdown-item danger" onClick={handleLogout}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Log Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle on Right */}
          <button
            className="rb-header-toggle"
            onClick={() => setShowMobileNav(true)}
            aria-label="Open Navigation"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {showMobileNav && (
        <div
          className="rb-mobile-nav-overlay"
          onClick={() => setShowMobileNav(false)}
        >
          <div
            className="rb-mobile-nav-sidebar"
            ref={mobileNavRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rb-mobile-nav-header">
              <div className="rb-header-brand" onClick={() => goTo("/")}>
                <div className="rb-brand-icon-box">
                  {siteLogoUrl ? (
                    <img src={siteLogoUrl} alt={siteName} className="rb-brand-img" />
                  ) : (
                    <i className="fa-solid fa-comments rb-brand-icon"></i>
                  )}
                </div>
                <span className="rb-brand-name">{siteName || "Talkify"}</span>
              </div>
              <button
                className="rb-mobile-close-btn"
                onClick={() => setShowMobileNav(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* User Profile Card inside Mobile Drawer */}
            {token && user && (
              <div
                className="rb-mobile-user-card"
                onClick={() => goTo("/profile")}
                title="Open Profile Settings"
              >
                <div className="rb-mobile-user-avatar-box">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="rb-mobile-avatar" />
                  ) : (
                    <i className="fa-solid fa-user"></i>
                  )}
                  <span className="rb-avatar-online-dot"></span>
                </div>
                <div className="rb-mobile-user-details">
                  <span className="rb-mobile-user-name">{user.name}</span>
                  <span className="rb-mobile-user-email">{user.email}</span>
                </div>
                <i className="fa-solid fa-gear rb-mobile-gear-icon"></i>
              </div>
            )}

            <div className="rb-mobile-nav-links">
              <span
                className={`rb-mobile-nav-link ${isActive("/") ? "active" : ""}`}
                onClick={() => goTo("/")}
              >
                <i className="fa-solid fa-house me-2 text-emerald"></i>
                Home
              </span>

              <span
                className={`rb-mobile-nav-link ${isActive("/about") ? "active" : ""}`}
                onClick={() => goTo("/about")}
              >
                <i className="fa-solid fa-circle-info me-2 text-cyan"></i>
                About
              </span>

              <span
                className={`rb-mobile-nav-link ${isActive("/contact") ? "active" : ""}`}
                onClick={() => goTo("/contact")}
              >
                <i className="fa-solid fa-envelope me-2 text-mint"></i>
                Contact
              </span>

              {token && (
                <span
                  className={`rb-mobile-nav-link ${isActive("/chat") ? "active" : ""}`}
                  onClick={() => goTo("/chat")}
                >
                  <i className="fa-solid fa-comments me-2 text-emerald"></i>
                  Messages
                </span>
              )}

              {token && (
                <span
                  className={`rb-mobile-nav-link ${isActive("/profile") ? "active" : ""}`}
                  onClick={() => goTo("/profile")}
                >
                  <i className="fa-solid fa-user-gear me-2 text-cyan"></i>
                  Profile &amp; Settings
                </span>
              )}
            </div>

            <div className="rb-mobile-nav-footer">
              {token ? (
                <button className="rb-btn-danger w-100" onClick={handleLogout}>
                  Log Out
                </button>
              ) : (
                <div className="d-flex flex-column gap-2 w-100">
                  <button
                    className="rb-btn-ghost w-100"
                    onClick={() => goTo("/login")}
                  >
                    Log In
                  </button>
                  <button
                    className="rb-btn-primary w-100"
                    onClick={() => goTo("/register")}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;