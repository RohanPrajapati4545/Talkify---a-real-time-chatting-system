import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login } from "../redux/AuthSlice";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return toast.error("All fields are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address");
    }

    setLoading(true);
    try {

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          email,
          password,
        }
      );

      dispatch(
        login({
          token: res.data.token,
          user: res.data.user,
        })
      );

      toast.success(res.data.msg);

      setEmail("");
      setPassword("");
      navigate("/")
    } catch (error) {
      toast.error(error.response?.data?.msg || "Login failed");
    }
    finally {

      setLoading(false);

    }
  };

  return (

    <div className="cv-auth-page">

      <div className="cv-auth-box">

        <div className="cv-auth-left">

          <span className="cv-brand-tag cv-auth-eyebrow">Talkify</span>
          <h1 className="cv-auth-title">Sign in</h1>
          <p className="cv-auth-subtitle">Pick up where you left off.</p>

          <form onSubmit={loginUser}>

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
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>

            <div className="cv-auth-switch">
              <p>Don't have an account?</p>
              <span onClick={() => navigate("/register")}>Sign up</span>
            </div>

          </form>

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