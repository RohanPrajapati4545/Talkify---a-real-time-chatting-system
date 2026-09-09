import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const Recovery = () => {
  const { siteName, siteLogoUrl } = useSelector((state) => state.brand);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (!storedEmail) {
      toast.error("Email not found. Please try again.");
      navigate("/forgot-password");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      return toast.error("Enter the OTP sent to your email");
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/verify-email-otp`,
        { email, otp }
      );

      toast.success(res.data.msg || "OTP verified successfully");
      navigate("/reset-password");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Invalid or expired OTP");
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
          <h1 className="cv-auth-title">Verify OTP</h1>
          <p className="cv-auth-subtitle">
            Enter the 6 digit OTP sent to {email}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="cv-auth-field">
              <i className="fa-solid fa-key"></i>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
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
                  Verifying…
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          <div className="cv-auth-switch">
            <p>Didn't get the code?</p>
            <span onClick={() => navigate("/forgot-password")}>
              Resend / change email
            </span>
          </div>
        </div>

        <div className="cv-auth-right">
          <span className="cv-auth-stamp">EST. CONNECTION</span>
          <h1>
            Almost
            <br />
            there.
          </h1>
          <p>One step away from setting a new password.</p>
        </div>
      </div>
    </div>
  );
};

export default Recovery;