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
    <footer className="cv-footer admin-footer-fixed">
     

      <div className= "cv-footer-bottom">
        © {new Date().getFullYear()} {siteName || "Talkify"}. Admin Panel — All rights reserved.
      </div>
    </footer>
  );
};

export default AdminFooter;