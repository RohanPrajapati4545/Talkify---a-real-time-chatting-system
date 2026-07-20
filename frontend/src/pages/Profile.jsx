import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { updateUser } from "./../../../frontend/src/pages/redux/AuthSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [contact, setContact] = useState(user?.contact || "");
  const [image, setImage] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // Telegram jaisa default avatar — naam ke initials se, jab image remove ho jaye
  const getDefaultAvatar = (userName) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=random&color=fff&rounded=true&bold=true`;

  const avatarSrc = imageRemoved
    ? getDefaultAvatar(name)
    : image
    ? URL.createObjectURL(image)
    : user?.image;

  const handleRemoveImage = () => {
    Swal.fire({
      icon: "warning",
      title: "Remove profile photo?",
      text: "Your photo will be replaced with a default avatar.",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setImage(null);
        setImageRemoved(true);
      }
    });
  };

  const handleNameChange = (e) => {
    // sirf letters aur space allow, numbers/special characters type hi nahi honge
    setName(e.target.value.replace(/[^A-Za-z\s]/g, ""));
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name.trim() || !nameRegex.test(name.trim())) {
      return Swal.fire({
        icon: "error",
        title: "Name should not contain numbers or special characters",
      });
    }

    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("phone", contact);
      // email is locked — intentionally not sent for update

      if (image) {
        formData.append("image", image);
      }

      if (imageRemoved) {
        formData.append("removeImage", "true");
      }

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      dispatch(updateUser(res.data.user));

      Swal.fire({
        icon: "success",
        title: res.data.message,
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setContact(user?.contact || "");
    setImageRemoved(false);
    setImage(null);
  }, [user]);

  return (
    <div className="cv-dash">
      {/* ============== TOP BAR ============== */}
      <div className="cv-dash-topbar">
        <div className="cv-dash-topbar-left">
          <i className="fa-solid fa-arrow-left cv-back-btn" onClick={() => navigate(-1)}></i>
          <div>
            <span className="cv-brand-tag">Account</span>
            <h2 className="cv-dash-title">Settings</h2>
          </div>
        </div>
      </div>

      <div className="cv-dash-grid">
        {/* ============== LEFT — PROFILE SUMMARY ============== */}
        <aside className="cv-dash-side">
          <div className="cv-dash-side-avatar-box">
            <img
              src={avatarSrc}
              alt=""
              className="cv-dash-side-avatar"
              style={{ cursor: "pointer" }}
              onClick={() => setShowLightbox(true)}
            />
            <label className="cv-profile-image-edit" htmlFor="profileImageInput">
              <i className="fa-solid fa-camera" style={{ cursor: "pointer" }}></i>
            </label>
            {!imageRemoved && (image || user?.image) && (
              <i
                className="fa-solid fa-trash cv-profile-image-remove"
                style={{ cursor: "pointer" }}
                title="Remove photo"
                onClick={handleRemoveImage}
              ></i>
            )}
            <input
              id="profileImageInput"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                setImage(e.target.files[0]);
                setImageRemoved(false);
              }}
            />
          </div>

          <h3 className="cv-dash-side-name">{name || "Unnamed"}</h3>
        
        

          <div className="cv-dash-side-divider"></div>

          <div className="cv-dash-side-menu">
            <div className="cv-dash-side-menu-item active">
              <i className="fa-solid fa-user"></i> Profile
            </div>
            <div className="cv-dash-side-menu-item" onClick={() => navigate("/chat")}>
              <i className="fa-solid fa-comments"></i> Chats
            </div>
            <div className="cv-dash-side-menu-item danger" onClick={() => navigate(-1)}>
              <i className="fa-solid fa-arrow-left"></i> Back
            </div>
          </div>
        </aside>

        {/* ============== RIGHT — EDIT FORM ============== */}
        <main className="cv-dash-main">
          <div className="cv-dash-section">
            <div className="cv-dash-section-head">
              <h3>Personal Information</h3>
            
            </div>

            <form onSubmit={updateProfile} className="cv-dash-form">
              <div className="cv-dash-form-row">
                <div className="cv-dash-form-field">
                  <label className="cv-field-label">Name</label>
                  <input
                    type="text"
                    className="form-control cv-input"
                    value={name}
                    onChange={handleNameChange}
                  />
                </div>

                <div className="cv-dash-form-field">
                  <label className="cv-field-label">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control cv-input cv-input-disabled"
                    maxLength={10}
                    value={contact}
                    disabled
                    readOnly
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>
              </div>

              <div className="cv-dash-form-row">
                <div className="cv-dash-form-field">
                  <label className="cv-field-label">
                    Email 
                  </label>
                  <input
                    type="email"
                    className="form-control cv-input cv-input-disabled"
                    value={email}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="cv-dash-form-footer">
                <button
                  type="submit"
                  className="cv-btn-primary cv-dash-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Updating…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* ============== IMAGE LIGHTBOX ============== */}
      {showLightbox && (
        <div className="cv-lightbox" onClick={() => setShowLightbox(false)}>
          <div className="cv-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={avatarSrc} alt="" />
            <div className="cv-lightbox-actions">
              <button onClick={() => setShowLightbox(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
              <a href={avatarSrc} download target="_blank" rel="noreferrer">
                <i className="fa-solid fa-download"></i>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;