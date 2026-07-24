import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { logout } from "./../../../frontend/src/pages/redux/AuthSlice";
import Loader from "./Loader";

const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
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
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        setLoading(false);
      }
    });
  };

  // Sirf logged-in state me hi ye function chalega ab (profile icon sirf tab dikhta hai)
  const handleProfileIconClick = () => {
    setShowMenu((prev) => !prev);
  };

  return (
    <>
      {loading && <Loader />}

      <header className=" cv-header">
        <div className="  cv-header-inner">

          <div className="cv-header-brand" onClick={() => goTo("/")}>
            <span className="cv-brand-mark">Talkify</span>
          </div>

          <div
            className="cv-header-toggle"
            onClick={() => setShowMobileNav(true)}
          >
            <i className="fa-solid fa-bars"></i>
          </div>

          <div className="cv-header-right">

            <nav className="cv-header-nav">
              <span className="cv-header-link me-3" onClick={() => goTo("/")}>
                <i className="fa-solid fa-house"></i>
                <span>Home</span>
              </span>
 <span className="cv-header-link me-2" onClick={() => goTo("/about")}>
                <i className="fa-solid fa-circle-info"></i>
                <span>About</span>
              </span>
              <span className="cv-header-link me-2" onClick={() => goTo("/contact")}>
                <i className="fa-solid fa-circle-info"></i>
                <span>Contact Us</span>
              </span>

              {token && (
                <span className="cv-header-link me-3" onClick={() => goTo("/chat")}>
                  <i className="fa-solid fa-comments "></i>
                  <span>Chat</span>
                </span>
              )}
            </nav>

            <div className="cv-header-profile-wrap" ref={menuRef}>

              {/* 👇 Login hai to profile icon, warna Sign In button */}
              {token ? (
                <div
                  className="cv-header-profile-btn"
                  onClick={handleProfileIconClick}
                >
                  {user?.image ? (
                    <img src={user.image} alt="" className="cv-header-avatar" />
                  ) : (
                    <i className="fa-solid fa-circle-user"></i>
                  )}
                </div>
              ) : (
                <button
                  className="cv-btn-primary cv-cta-shine ms-3"
                  onClick={() => goTo("/login")}
                >
                  Sign In
                </button>
              )}

              {token && showMenu && (
                <div className="cv-header-dropdown ">
                  <div className="cv-header-dropdown-item " onClick={() => goTo("/profile")}>
                    <i className="fa-solid fa-user "></i>
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

              <span className="cv-mobile-nav-link" onClick={() => goTo("/contact")}>
                <i className="fa-solid fa-circle-info"></i>
                <span>Contact Us</span>
              </span>

              {token && (
                <span className="cv-mobile-nav-link" onClick={() => goTo("/chat")}>
                  <i className="fa-solid fa-comments"></i>
                  <span>Chat</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;