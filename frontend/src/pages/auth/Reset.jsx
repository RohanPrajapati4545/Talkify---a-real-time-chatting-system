import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const Reset = () => {
  const { siteName, siteLogoUrl } = useSelector((state) => state.brand);
  const email = localStorage.getItem("resetEmail");
  const [new_password, setNewPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const MAX_PASSWORD_LENGTH = 15;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!new_password || !confirm_password) {
      return toast.error("All fields are required");
    }
    if (new_password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    if (new_password !== confirm_password) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
        { email, new_password, confirm_password }
      );

      toast.success(res.data.msg || "Password reset successfully");
      localStorage.removeItem("resetEmail");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Something went wrong");
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
          <h1 className="cv-auth-title">Reset password</h1>
          <p className="cv-auth-subtitle">Choose a new password for your account.</p>

          <form onSubmit={handleSubmit}>
            <div className="cv-auth-field">
              <i className="fa-solid fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={new_password}
                maxLength={MAX_PASSWORD_LENGTH}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <i
                className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} cv-toggle-password`}
                onClick={() => setShowPassword((prev) => !prev)}
              ></i>
            </div>

            <div className="cv-auth-field">
              <i className="fa-solid fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirm_password}
                maxLength={MAX_PASSWORD_LENGTH}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Resetting…
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        </div>

        <div className="cv-auth-right">
          <span className="cv-auth-stamp">EST. CONNECTION</span>
          <h1>
            New
            <br />
            beginning.
          </h1>
          <p>Set a password you'll actually remember.</p>
        </div>
      </div>
    </div>
  );
};

export default Reset;