import React from "react";
import { useNavigate } from "react-router-dom";


const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="cv-footer">
      <div className="cv-footer-inner">

        <div className="cv-footer-brand">
          <span className="cv-brand-mark">Talkify</span>
          <p>Connect · Converse · Collaborate</p>
        </div>

        <div className="cv-footer-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/about")}>About</span>
          <span onClick={() => navigate("/chat")}>Chat</span>
          <span onClick={() => navigate("/profile")}>Profile</span>
        </div>

        <div className="cv-footer-social">
          <i className="fa-brands fa-github"></i>
          <i className="fa-brands fa-twitter"></i>
          <i className="fa-brands fa-linkedin"></i>
        </div>

      </div>

      <div className="cv-footer-bottom">
        © {new Date().getFullYear()} Talkify. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;