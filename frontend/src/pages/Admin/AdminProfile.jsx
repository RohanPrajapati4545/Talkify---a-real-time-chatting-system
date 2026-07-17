import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { updateUser } from "../redux/AuthSlice";

const AdminProfile = () => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user?.image || "");
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(""); // "weak" | "medium" | "strong" | ""

  // show/hide toggles for each password field
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const MAX_PASSWORD_LENGTH = 15;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ---------- Password strength checker (same logic as Register) ----------
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

  const strengthLabel = {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value.slice(0, MAX_PASSWORD_LENGTH);
    setNewPassword(value);
    setPasswordStrength(getPasswordStrength(value));
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value.slice(0, MAX_PASSWORD_LENGTH));
  };

  const handleOldPasswordChange = (e) => {
    setOldPassword(e.target.value.slice(0, MAX_PASSWORD_LENGTH));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", name);
      // email intentionally not sent — field is disabled/read-only
      if (image) formData.append("image", image);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      dispatch(updateUser(res.data.user));

      Swal.fire({
        title: "Saved",
        text: "Profile updated successfully.",
        icon: "success",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });
    } catch (error) {
      console.log(error);
      Swal.fire({
        title: "Error",
        text: "Could not update profile.",
        icon: "error",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      Swal.fire({
        title: "Too Short",
        text: "New password must be at least 6 characters.",
        icon: "warning",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });
      return;
    }

    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      Swal.fire({
        title: "Too Long",
        text: `New password must be at most ${MAX_PASSWORD_LENGTH} characters.`,
        icon: "warning",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: "Mismatch",
        text: "New password and confirm password do not match.",
        icon: "warning",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });
      return;
    }

    try {
      setChangingPassword(true);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        title: "Password Changed",
        text: "Your password has been updated.",
        icon: "success",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.log(error);
      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Could not change password.",
        icon: "error",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="dashboard-wrapper p-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Settings</h2>
        <p className="text-muted mb-0">Manage your admin profile</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="bg-white rounded-4 shadow-sm p-4">
            <h4 className="fw-bold mb-4">Profile Details</h4>

            <form onSubmit={handleProfileSubmit}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <img
                  src={preview}
                  alt=""
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--hairline)",
                  }}
                />
                <div>
                  <label htmlFor="profileImage" className="btn btn-sm btn-outline-warning mb-0">
                    Change Photo
                  </label>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label admin-label">Name</label>
                <input
                  type="text"
                  className="form-control admin-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label admin-label">Email</label>
                <input
                  type="email"
                  className="form-control admin-input"
                  value={email}
                  disabled
                  readOnly
                  title="Email cannot be changed"
                />
              </div>

              <button type="submit" className="btn btn-warning" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="bg-white rounded-4 shadow-sm p-4">
            <h4 className="fw-bold mb-4">Change Password</h4>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label admin-label">Current Password</label>
                <div className="cv-auth-field position-relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    className="form-control admin-input"
                    value={oldPassword}
                    onChange={handleOldPasswordChange}
                    maxLength={MAX_PASSWORD_LENGTH}
                    required
                  />
                  <i
                    className={`fa-solid ${showOldPassword ? "fa-eye-slash" : "fa-eye"} cv-toggle-password`}
                    onClick={() => setShowOldPassword((prev) => !prev)}
                  ></i>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label admin-label">New Password</label>
                <div className="cv-auth-field position-relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="form-control admin-input"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    required
                    minLength={6}
                    maxLength={MAX_PASSWORD_LENGTH}
                  />
                  <i
                    className={`fa-solid ${showNewPassword ? "fa-eye-slash" : "fa-eye"} cv-toggle-password`}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  ></i>
                </div>

                {/* ---------- Password strength indicator (same as Register) ---------- */}
                {newPassword && (
                  <div className={`cv-password-strength cv-strength-${passwordStrength}`}>
                    <div className="cv-strength-bar">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p>{strengthLabel[passwordStrength]}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label admin-label">Confirm New Password</label>
                <div className="cv-auth-field position-relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control admin-input"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    minLength={6}
                    maxLength={MAX_PASSWORD_LENGTH}
                  />
                  <i
                    className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} cv-toggle-password`}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  ></i>
                </div>
              </div>

              <button type="submit" className="btn btn-warning" disabled={changingPassword}>
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;