import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { updateUser } from "./redux/AuthSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [contact, setContact] = useState(user?.contact || "");
  const [image, setImage] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Default avatar generator
  const getDefaultAvatar = (userName) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName || "U"
    )}&background=00f5a0&color=080b0e&rounded=true&bold=true`;

  const avatarSrc = imageRemoved
    ? getDefaultAvatar(name)
    : image
    ? URL.createObjectURL(image)
    : user?.image || getDefaultAvatar(name);

  const handleRemoveImage = () => {
    Swal.fire({
      icon: "warning",
      title: "Remove photo?",
      text: "Your profile photo will be reset to the default avatar.",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      background: "#0d1217",
      color: "#f8fafc",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#1e293b",
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (image) {
          setImage(null);
          setImageRemoved(true);
          Swal.fire({
            icon: "success",
            title: "Photo Cleared",
            text: "Selected photo removed.",
            timer: 1500,
            showConfirmButton: false,
            allowOutsideClick: true,
            allowEscapeKey: true,
            background: "#0d1217",
            color: "#f8fafc",
          });
          return;
        }

        if (user?.image) {
          setLoading(true);
          try {
            const formData = new FormData();
            formData.append("name", name || user.name);
            formData.append("phone", contact || user.contact || "");
            formData.append("removeImage", "true");

            const res = await axios.put(
              `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/users/update-profile`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            dispatch(updateUser(res.data.user));
            setImage(null);
            setImageRemoved(false);

            Swal.fire({
              icon: "success",
              title: "Photo Removed",
              text: "Your profile photo has been reset to default avatar.",
              timer: 1800,
              showConfirmButton: false,
              allowOutsideClick: true,
              allowEscapeKey: true,
              background: "#0d1217",
              color: "#f8fafc",
            });
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Failed to Remove Photo",
              text: error.response?.data?.message || "Something went wrong",
              allowOutsideClick: true,
              allowEscapeKey: true,
              background: "#0d1217",
              color: "#f8fafc",
              confirmButtonColor: "#00f5a0",
            });
          } finally {
            setLoading(false);
          }
        }
      }
    });
  };

  const handleNameChange = (e) => {
    setName(e.target.value.replace(/[^A-Za-z\s]/g, ""));
  };

  const handleCopyUid = () => {
    if (user?._id && navigator?.clipboard) {
      navigator.clipboard.writeText(user._id);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const updateProfile = async (e) => {
    e?.preventDefault();

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name.trim() || !nameRegex.test(name.trim())) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Name",
        text: "Name should only contain letters and spaces.",
        background: "#0d1217",
        color: "#f8fafc",
        confirmButtonColor: "#00f5a0",
      });
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", contact);

      if (image) {
        formData.append("image", image);
      }

      if (imageRemoved) {
        formData.append("removeImage", "true");
      }

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/users/update-profile`,
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
        title: res.data.message || "Profile Updated",
        text: "Your changes have been saved successfully.",
        timer: 1800,
        showConfirmButton: false,
        background: "#0d1217",
        color: "#f8fafc",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.response?.data?.message || "Something went wrong",
        background: "#0d1217",
        color: "#f8fafc",
        confirmButtonColor: "#00f5a0",
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
    <div className="tk-profile-dashboard">
      {/* Top Header Bar */}
      <div className="tk-profile-topbar">
        <div className="tk-profile-topbar-left">
          <button
            type="button"
            className="tk-profile-back-btn"
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="tk-profile-eyebrow">
              <i className="fa-solid fa-user-check me-1 text-emerald"></i>
              ACCOUNT PROFILE
            </div>
            <h2 className="tk-profile-page-title">My Profile</h2>
          </div>
        </div>

        <div className="tk-profile-topbar-right">
          <button
            type="button"
            className="tk-profile-action-btn"
            onClick={() => navigate("/chat")}
          >
            <i className="fa-solid fa-comments me-2"></i>
            <span>Open Chat</span>
          </button>
        </div>
      </div>

      {/* Main Clean Profile Container */}
      <div className="tk-profile-clean-container">
        <div className="tk-profile-clean-card">
          {/* Avatar Section */}
          <div className="tk-profile-avatar-header">
            <div className="tk-profile-avatar-wrapper">
              <div className="tk-profile-avatar-glow"></div>
              <img
                src={avatarSrc}
                alt={name}
                className="tk-profile-avatar-img"
                onClick={() => setShowLightbox(true)}
                title="Click to view full photo"
              />
              <label
                className="tk-avatar-camera-btn"
                htmlFor="profileImageInput"
                title="Upload new photo"
              >
                <i className="fa-solid fa-camera"></i>
              </label>

              {!imageRemoved && (image || user?.image) && (
                <button
                  type="button"
                  className="tk-avatar-remove-btn"
                  onClick={handleRemoveImage}
                  title="Remove photo"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              )}

              <input
                id="profileImageInput"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImage(e.target.files[0]);
                    setImageRemoved(false);
                  }
                }}
              />
            </div>

            <div className="tk-profile-identity-info">
              <h3 className="tk-profile-user-name">{name || "Talkify User"}</h3>
              <div className="tk-profile-badge-row">
                <span className="tk-role-badge">
                  <i className="fa-solid fa-shield-check me-1"></i>
                  {user?.role === "admin" ? "Administrator" : "Member"}
                </span>
                <span className="tk-online-indicator">
                  <span className="tk-online-dot"></span> Online
                </span>
              </div>
            </div>
          </div>

          <div className="tk-profile-divider"></div>

          {/* Form Fields: Only Important Info */}
          <form onSubmit={updateProfile} className="tk-profile-form">
            <div className="tk-form-grid">
              {/* 1. Full Name */}
              <div className="tk-form-group">
                <label className="tk-field-label">
                  <span>FULL NAME</span>
                  <span className="tk-label-hint">Editable</span>
                </label>
                <div className="tk-input-wrapper">
                  <i className="fa-solid fa-user tk-input-icon"></i>
                  <input
                    type="text"
                    className="tk-profile-input"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Enter your full name"
                    maxLength={40}
                    required
                  />
                </div>
              </div>

              {/* 2. Contact Number */}
              <div className="tk-form-group">
                <label className="tk-field-label">
                  <span>CONTACT NUMBER</span>
                  <span className="tk-label-locked">
                    <i className="fa-solid fa-lock me-1"></i> Verified
                  </span>
                </label>
                <div className="tk-input-wrapper readonly">
                  <i className="fa-solid fa-phone tk-input-icon"></i>
                  <input
                    type="tel"
                    className="tk-profile-input readonly"
                    value={contact || "Not provided"}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {/* 3. Email Address */}
              <div className="tk-form-group">
                <label className="tk-field-label">
                  <span>EMAIL ADDRESS</span>
                  <span className="tk-label-locked">
                    <i className="fa-solid fa-lock me-1"></i> Verified
                  </span>
                </label>
                <div className="tk-input-wrapper readonly">
                  <i className="fa-solid fa-envelope tk-input-icon"></i>
                  <input
                    type="email"
                    className="tk-profile-input readonly"
                    value={email || "No email linked"}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {/* 4. User ID (UID) */}
              <div className="tk-form-group">
                <label className="tk-field-label">
                  <span>USER ID (UID)</span>
                  <span
                    className="tk-copy-uid-trigger"
                    onClick={handleCopyUid}
                    title="Click to copy"
                  >
                    <i className={`fa-solid ${copiedUid ? "fa-check text-emerald" : "fa-copy"} me-1`}></i>
                    {copiedUid ? "Copied!" : "Copy UID"}
                  </span>
                </label>
                <div className="tk-input-wrapper readonly">
                  <i className="fa-solid fa-fingerprint tk-input-icon"></i>
                  <input
                    type="text"
                    className="tk-profile-input readonly tk-mono"
                    value={user?._id || "talkify_user_uid"}
                    readOnly
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="tk-form-actions">
              <button
                type="submit"
                className="tk-btn-save-profile"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin me-2"></i>
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk me-2"></i>
                    <span>Save Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="tk-btn-reset-profile"
                onClick={() => {
                  setName(user?.name || "");
                  setImage(null);
                  setImageRemoved(false);
                }}
              >
                <span>Reset</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lightbox for Profile Photo */}
      {showLightbox && (
        <div className="cv-lightbox" onClick={() => setShowLightbox(false)}>
          <div className="cv-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={avatarSrc} alt={name} />
            <div className="cv-lightbox-actions">
              <button onClick={() => setShowLightbox(false)} title="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
              <a href={avatarSrc} download target="_blank" rel="noreferrer" title="Download">
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