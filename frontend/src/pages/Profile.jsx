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
  const { user, token } = useSelector(
    (state) => state.auth
  );
  const navigate = useNavigate()
  const [name, setName] = useState(
    user?.name || ""
  );

  const [email, setEmail] = useState(
    user?.email || ""
  );

  const [image, setImage] = useState(null);

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("email", email);

      if (image) {
        formData.append("image", image);
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

      dispatch(
        updateUser(res.data.user)
      );

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
        title:
          error.response?.data?.message ||
          "Something went wrong",
      });
    }
    finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  return (
    <div className="cv-profile-page">

      <div className="cv-profile-card">

        <i
          className="fa-solid fa-arrow-left cv-profile-back"
          onClick={() => navigate(-1)}
        ></i>

        <span className="cv-brand-tag cv-profile-eyebrow">Account</span>
        <h2 className="cv-profile-title">My Profile</h2>

        <div className="cv-profile-image-box">

          <img
            src={
              image
                ? URL.createObjectURL(image)
                : `${process.env.REACT_APP_API_URL}/uploads/${user?.image}`
            }
            alt=""
            className="cv-profile-image"
          />

          <label className="cv-profile-image-edit" htmlFor="profileImageInput">
            <i className="fa-solid fa-camera"></i>
          </label>

          <input
            id="profileImageInput"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />

        </div>

        <form onSubmit={updateProfile}>

          <div className="mb-3">
            <label className="cv-field-label">Name</label>
            <input
              type="text"
              className="form-control cv-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="cv-field-label">Email</label>
            <input
              type="email"
              className="form-control cv-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="cv-btn-primary cv-profile-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                Updating…
              </>
            ) : (
              "Update profile"
            )}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Profile;