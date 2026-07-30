import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/AuthSlice";

const Login = () => {
  const [mode, setMode] = useState("password");

  const { siteName, siteLogoUrl, otpLoginEnabled } = useSelector((state) => state.brand);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const MAX_PASSWORD_LENGTH = 15;

  useEffect(() => {
    if (!otpLoginEnabled && mode === "otp") setMode("password");
  }, [otpLoginEnabled, mode]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value.slice(0, MAX_PASSWORD_LENGTH));
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value.replace(/[^a-zA-Z0-9@.]/g, ""));
  };

  const loginUser = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return toast.error("All fields are required");
    }

    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address");
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password }
      );

      dispatch(login({ token: res.data.token, user: res.data.user }));

      toast.success(res.data.msg);

      setEmail("");
      setPassword("");
      setShowPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      return toast.error("Phone number is required");
    }

    if (!phoneRegex.test(phone)) {
      return toast.error("Please enter a valid 10-digit phone number");
    }

    setSendingOtp(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/send-otp`,
        { phone }
      );

      toast.success(res.data.msg || "OTP sent to your phone");
      setOtpSent(true);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Couldn't send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      return toast.error("Enter the OTP sent to your phone");
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`,
        { phone, otp }
      );

      dispatch(login({ token: res.data.token, user: res.data.user }));

      toast.success(res.data.msg || "Signed in successfully");

      setPhone("");
      setOtp("");
      setOtpSent(false);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "admin") {
      navigate("/admin");
    } else if (token) {
      navigate("/");
    }
  }, [token, user]);

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
          <h1 className="cv-auth-title">Sign in</h1>
          <p className="cv-auth-subtitle">Pick up where you left off.</p>

          {otpLoginEnabled && (
            <div className="cv-dial cv-auth-dial">
              <button
                type="button"
                className={mode === "password" ? "active" : ""}
                onClick={() => setMode("password")}
              >
                Password
              </button>
              <button
                type="button"
                className={mode === "otp" ? "active" : ""}
                onClick={() => setMode("otp")}
              >
                OTP
              </button>
            </div>
          )}

          {mode === "password" && (
            <form onSubmit={loginUser}>
              <div className="cv-auth-field">
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>

              <div className="cv-auth-field">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  maxLength={MAX_PASSWORD_LENGTH}
                  onChange={handlePasswordChange}
                />
                <i
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} cv-toggle-password`}
                  onClick={() => setShowPassword((prev) => !prev)}
                ></i>
              </div>

              <div className="cv-auth-forgot">
                <span onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                className="cv-btn-primary cv-auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          )}

          {otpLoginEnabled && mode === "otp" && (
            <form onSubmit={otpSent ? verifyOtp : sendOtp}>
              <div className="cv-auth-field">
                <i className="fa-solid fa-phone"></i>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone number"
                  value={phone}
                  disabled={otpSent}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                />
              </div>

              {otpSent && (
                <div className="cv-auth-field">
                  <i className="fa-solid fa-key"></i>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              )}

              {!otpSent ? (
                <button
                  type="submit"
                  className="cv-btn-primary cv-auth-submit"
                  disabled={sendingOtp}
                >
                  {sendingOtp ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      Sending OTP…
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              ) : (
                <>
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
                      "Verify & Sign in"
                    )}
                  </button>

                  <div className="cv-auth-switch">
                    <p>Didn't get the code?</p>
                    <span onClick={() => { setOtpSent(false); setOtp(""); }}>
                      Change number / resend
                    </span>
                  </div>
                </>
              )}
            </form>
          )}

          <div className="cv-auth-switch">
            <p>Don't have an account?</p>
            <span onClick={() => navigate("/register")}>Sign up</span>
          </div>
        </div>

        <div className="cv-auth-right">
          <span className="cv-auth-stamp">EST. CONNECTION</span>
          <h1>
            Welcome
            <br />
            back.
          </h1>
          <p>Your conversations are exactly where you left them.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;