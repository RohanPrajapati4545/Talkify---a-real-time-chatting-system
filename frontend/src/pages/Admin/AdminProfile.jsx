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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                <input
                  type="password"
                  className="form-control admin-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label admin-label">New Password</label>
                <input
                  type="password"
                  className="form-control admin-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="mb-4">
                <label className="form-label admin-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control admin-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
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