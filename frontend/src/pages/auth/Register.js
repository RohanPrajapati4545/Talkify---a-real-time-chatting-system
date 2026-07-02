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

  const navigate = useNavigate();

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
        "http://localhost:5000/api/auth/register",
        formData
      );

      toast.success(res.data.msg);

      setName("");
      setEmail("");
      setContact("");
      setPassword("");
      setConfirmPassword("");
      setImage(null);

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
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="cv-auth-field">
              <i className="fa-solid fa-key"></i>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
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