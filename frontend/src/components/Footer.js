import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    Swal.fire({
      icon: "success",
      title: "Subscribed!",
      timer: 1400,
      showConfirmButton: false,
    });
    setEmail("");
  };

  return (
    <footer className="cv-footer">
      <div className="cv-footer-inner">
       

        <div className="cv-footer-col">
          <span className="cv-footer-col-title">Product</span>
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/chat")}>Chat</span>
          <span onClick={() => navigate("/pricing")}>Pricing</span>
          <span onClick={() => navigate("/status")}>Status</span>
        </div>

      
        <div className="cv-footer-col">
          <span className="cv-footer-col-title">Resources</span>
          <span onClick={() => navigate("/docs")}>Developer API</span>
          <span onClick={() => navigate("/tools")}>Tools</span>
          <span onClick={() => navigate("/blog")}>Blog</span>
        </div>

       
        <div className="cv-footer-col">
          <span className="cv-footer-col-title">Company</span>
          <span onClick={() => navigate("/about")}>About Us</span>
          <span onClick={() => navigate("/terms")}>Terms of Service</span>
          <span onClick={() => navigate("/privacy")}>Privacy</span>
        </div>


        <div className="cv-footer-col cv-footer-newsletter">
          <span className="cv-footer-col-title">Stay on the line</span>
          <p className="cv-footer-newsletter-sub">Subscribe to our email newsletter</p>

          <form className="cv-footer-subscribe" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Your email"
              className="cv-footer-subscribe-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="cv-footer-subscribe-btn">
              Subscribe
            </button>
          </form>

          <span className="cv-footer-col-title cv-footer-follow-title">Follow us</span>
          <div className="cv-footer-social">
            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter"></i></a>
            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
          </div>
        </div>
      </div>

      <div className="cv-footer-bottom">
        © {new Date().getFullYear()} Talkify. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;