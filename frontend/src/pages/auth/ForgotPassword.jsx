import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const ForgotPassword = () => {
  const { siteName, siteLogoUrl } = useSelector((state) => state.brand);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;

  const handleEmailChange = (e) => {
    setEmail(e.target.value.replace(/[^a-zA-Z0-9@.]/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      return toast.error("Email is required");
    }

    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address");
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/send-email-otp`,
        { email }
      );

      toast.success(res.data.msg || "OTP sent to your email");
      localStorage.setItem("resetEmail", email);
      navigate("/recovery");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Couldn't send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cv-auth-page">
      <div className="cv-auth-box">
        <div className="cv-auth-left">
          <span className="cv-brand-tag cv-auth-eyebrow">
            {siteLogoUrl ? (
              <img
                src={siteLogoUrl}
                alt={siteName}
                style={{
                  height: "3em",
                  width: "2.8em",
                  objectFit: "cover",
                  borderRadius: "4px",
                  verticalAlign: "middle",
                  display: "inline-block",
                }}
              />
            ) : (
              <i className="fa-solid fa-feather-pointed"></i>
            )}{" "}
            {siteName}
          </span>
          <h1 className="cv-auth-title">Forgot password</h1>
          <p className="cv-auth-subtitle">
            Enter your email and we'll send you an OTP to reset it.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="cv-auth-field">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={handleEmailChange}
              />
            </div>

            <button
              type="submit"
              className="cv-btn-primary cv-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  Sending OTP…
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>

          <div className="cv-auth-switch">
            <p>Remembered your password?</p>
            <span onClick={() => navigate("/login")}>Back to login</span>
          </div>
        </div>

        <div className="cv-auth-right">
          <span className="cv-auth-stamp">EST. CONNECTION</span>
          <h1>
            Reset
            <br />
            access.
          </h1>
          <p>We'll get you back in within a couple of minutes.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;