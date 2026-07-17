import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(""); // "weak" | "medium" | "strong" | ""
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const MAX_PASSWORD_LENGTH = 15;

  // ---------- Password strength checker ----------
  const getPasswordStrength = (pwd) => {
    if (!pwd) return "";

    if (pwd.length < 6) return "weak";

    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++; // special char

    if (score <= 2) return "weak";
    if (score === 3) return "medium";
    return "strong";
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value.slice(0, MAX_PASSWORD_LENGTH); // 15 char ke baad allow nahi
    setPassword(value);
    setPasswordStrength(getPasswordStrength(value));
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value.slice(0, MAX_PASSWORD_LENGTH);
    setConfirmPassword(value);
  };

  const strengthLabel = {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  };

  const register = async (e) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !contact.trim() ||
      !password.trim() ||
      !confirm_password.trim() ||
      !image
    ) {
      return toast.error("All fields are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address");
    }

    // ---------- Password length validation ----------
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return toast.error(`Password must be at most ${MAX_PASSWORD_LENGTH} characters`);
    }

    if (password !== confirm_password) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("email", email);
      formData.append("contact", contact);
      formData.append("password", password);
      formData.append("confirm_password", confirm_password);
      formData.append("image", image);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        formData
      );

      toast.success(res.data.msg);

      setName("");
      setEmail("");
      setContact("");
      setPassword("");
      setConfirmPassword("");
      setImage(null);
      setPasswordStrength("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Registration failed");
    }
    finally {

      setLoading(false);

    }
  };

  return (

    <div className="cv-auth-page">

      <div className="cv-auth-box cv-auth-box-tall">

        <div className="cv-auth-left">

          <span className="cv-brand-tag cv-auth-eyebrow">Talkify</span>
          <h1 className="cv-auth-title">Create account</h1>
          <p className="cv-auth-subtitle">Join the conversation.</p>

          <form onSubmit={register}>

            <div className="cv-auth-field">
              <i className="fa-solid fa-user"></i>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="cv-auth-field">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="cv-auth-field">
              <i className="fa-solid fa-phone"></i>
              <input
                type="text"
                placeholder="Contact"
                value={contact}
                maxLength={10}
                onChange={(e) =>
                  setContact(e.target.value.replace(/\D/g, ""))
                }
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

            {/* ---------- Password strength indicator ---------- */}
            {password && (
              <div className={`cv-password-strength cv-strength-${passwordStrength}`}>
                <div className="cv-strength-bar">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>{strengthLabel[passwordStrength]}</p>
              </div>
            )}

            <div className="cv-auth-field">
              <i className="fa-solid fa-key"></i>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirm_password}
                maxLength={MAX_PASSWORD_LENGTH}
                onChange={handleConfirmPasswordChange}
              />
              <i
                className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} cv-toggle-password`}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              ></i>
            </div>

            <label className="cv-auth-upload">
              <i className="fa-solid fa-camera"></i>
              <span>{image ? image.name : "Upload a profile photo"}</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>

            <button
              type="submit"
              className="cv-btn-primary cv-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>

            <div className="cv-auth-switch">
              <p>Already have an account?</p>
              <span onClick={() => navigate("/login")}>Sign in</span>
            </div>

          </form>

        </div>

        <div className="cv-auth-right">
          <span className="cv-auth-stamp">FIRST DISPATCH</span>
          <h1>
            Hello,
            <br />
            friend.
          </h1>
          <p>A few details and you're ready to send your first message.</p>
        </div>

      </div>

    </div>
  );
};

export default Register;