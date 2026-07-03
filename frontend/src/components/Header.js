import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { logout } from "./../../src/pages/redux/AuthSlice";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { isAuth, user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "You want to logout from your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(logout());
        navigate("/login");
      }
    });
  };

  return (
   <nav
  className="navbar navbar-expand-lg sticky-top py-2 header-navbar"
>
  <div className="container">

    <NavLink
      className="navbar-brand fw-bold brand-logo"
      to="/"
    >
     ChatVerse
    </NavLink>

    <button
      className="navbar-toggler border-0 shadow-none"
      type="button"
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="navbar-toggler-icon"></span>
    </button>

    <div
      className={`navbar-collapse ${
        isOpen ? "show" : "collapse"
      }`}
    >
      <ul className="navbar-nav gap-lg-3">

      
      </ul>

      <div className="ms-auto d-flex align-items-center gap-3 mt-3 mt-lg-0">

        {!isAuth ? (
          <>
               <div className="dropdown">

             <i
      className="fa-regular fa-user user-icon fs-2 text-success"
          onClick={()=>navigate("/login")}
      style={{ cursor: "pointer" }}
    ></i>
   

            <div className="dropdown-menu dropdown-menu-end profile-menu">

              <div className="text-center p-4">

                <img
                  src={
                    user?.image
                      ? `http://localhost:5000/uploads/${user.image}`
                      : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt=""
                  className="profile-img-large"
                />

                <h5 className="mt-2 mb-0">
                  {user?.name}
                </h5>

                <small className="text-muted">
                  {user?.email}
                </small>

              </div>

              <div
                className="dropdown-item-custom"
                onClick={() => navigate("/profile")}
              >
                My Profile
              </div>

              <div className="p-3 border-top">
                <button
                  onClick={handleLogout}
                  className="btn logout-btn w-100"
                >
                  Logout
                </button>
              </div>

            </div>

          </div>
          </>
        ) : (
          <div className="dropdown">

            <img
              data-bs-toggle="dropdown"
              src={
                user?.image
                  ? `http://localhost:5000/uploads/${user.image}`
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt=""
              className="profile-img dropdown-toggle"
            />

            <div className="dropdown-menu dropdown-menu-end profile-menu">

              <div className="text-center p-4">

                <img
                  src={
                    user?.image
                      ? `http://localhost:5000/uploads/${user.image}`
                      : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt=""
                  className="profile-img-large"
                />

                <h5 className="mt-2 mb-0">
                  {user?.name}
                </h5>

                <small className="text-muted">
                  {user?.email}
                </small>

              </div>

              <div
                className="dropdown-item-custom"
                onClick={() => navigate("/profile")}
              >
                My Profile
              </div>

              <div className="p-3 border-top">
                <button
                  onClick={handleLogout}
                  className="btn logout-btn w-100"
                >
                  Logout
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  </div>
</nav>
  );
};

export default Header;