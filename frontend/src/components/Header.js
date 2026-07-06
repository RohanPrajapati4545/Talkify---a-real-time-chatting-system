import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { logout } from "./../../../frontend/src/pages/redux/AuthSlice";
import Loader from "./Loader";


// 👇 NAYA — Header: Home, About, Chat links + profile icon.
// Login ke baad profile icon par user ki image dikhti hai, click karne par
// dropdown me Profile aur Logout ka option milta hai. Logged-out state me
// profile icon click karne par seedha Login page par chale jaate hain
// (koi dropdown nahi khulta).
const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 👇 NAYA — mobile par "Talkify" ki jagah aane wala hamburger toggle,
  // jo Home/About/Chat links ko sidebar (off-canvas) me kholta hai
  const [showMobileNav, setShowMobileNav] = useState(false);
  const mobileNavRef = useRef(null);

  const { token, user } = useSelector((state) => state.auth || {});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (path) => {
    setShowMenu(false);
    setShowMobileNav(false);
    navigate(path);
  };

  const handleLogout = () => {
    setShowMenu(false);
    setShowMobileNav(false);

    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Logout",
      confirmButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        dispatch(logout());
        navigate("/");
        setLoading(false);
      }
    });
  };

  // 👇 NAYA — logged-in ho to menu toggle karo, logged-out ho to seedha login bhej do
  const handleProfileIconClick = () => {
    if (token) {
      setShowMenu((prev) => !prev);
    } else {
      goTo("/login");
    }
  };

  return (
    <>
      {loading && <Loader />}

      <header className="cv-header">
        <div className="cv-header-inner">

          {/* Desktop/tablet par brand dikhta hai */}
          <div className="cv-header-brand" onClick={() => goTo("/")}>
            <span className="cv-brand-mark">Talkify</span>
          </div>

          {/* 👇 NAYA — mobile par brand ki jagah ye hamburger toggle dikhta hai */}
          <div
            className="cv-header-toggle"
            onClick={() => setShowMobileNav(true)}
          >
            <i className="fa-solid fa-bars"></i>
          </div>

          <div className="cv-header-right">

            <nav className="cv-header-nav">
              <span className="cv-header-link me-2" onClick={() => goTo("/")}>
                <i className="fa-solid fa-house"></i>
                <span>Home</span>
              </span>

              <span className="cv-header-link me-2" onClick={() => goTo("/about")}>
                <i className="fa-solid fa-circle-info"></i>
                <span>About</span>
              </span>

              <span className="cv-header-link me-5" onClick={() => goTo("/chat")}>
                <i className="fa-solid fa-comments"></i>
                <span>Chat</span>
              </span>
            </nav>

            <div className="cv-header-profile-wrap" ref={menuRef}>

              <div
                className="cv-header-profile-btn"
                onClick={handleProfileIconClick}
              >
                {token && user?.image ? (
                  <img src={user.image} alt="" className="cv-header-avatar" />
                ) : (
                  <i className="fa-solid fa-circle-user"></i>
                )}
              </div>

              {token && showMenu && (
                <div className="cv-header-dropdown">
                  <div className="cv-header-dropdown-item" onClick={() => goTo("/profile")}>
                    <i className="fa-solid fa-user"></i>
                    Profile
                  </div>
                  <div className="cv-header-dropdown-item danger" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    Logout
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </header>

      {/* 👇 NAYA — mobile nav sidebar (off-canvas). Sirf mobile breakpoint par
          hamburger click karne se dikhta hai, overlay ya cross click karne se band ho jaata hai */}
      {showMobileNav && (
        <div
          className="cv-mobile-nav-overlay"
          onClick={() => setShowMobileNav(false)}
        >
          <div
            className="cv-mobile-nav-sidebar"
            ref={mobileNavRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cv-mobile-nav-header">
              <span className="cv-brand-mark">Talkify</span>
              <i
                className="fa-solid fa-xmark"
                onClick={() => setShowMobileNav(false)}
              ></i>
            </div>

            <div className="cv-mobile-nav-links">
              <span className="cv-mobile-nav-link" onClick={() => goTo("/")}>
                <i className="fa-solid fa-house"></i>
                <span>Home</span>
              </span>

              <span className="cv-mobile-nav-link" onClick={() => goTo("/about")}>
                <i className="fa-solid fa-circle-info"></i>
                <span>About</span>
              </span>

              <span className="cv-mobile-nav-link" onClick={() => goTo("/chat")}>
                <i className="fa-solid fa-comments"></i>
                <span>Chat</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;