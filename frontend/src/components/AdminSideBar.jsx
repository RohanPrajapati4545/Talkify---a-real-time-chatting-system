import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "./../pages/redux/AuthSlice";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

const AdminSideBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to logout from your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(logout());
        navigate("/");
      }
    });
  };

  return (
    <div className="admin-sidebar">
      <div className="logo-section mt-3 mb-4">
        <h2 className="fw-bold mb-1 clickable" onClick={() => navigate("/admin")}>
          Admin Panel
        </h2>
      </div>

      <div className="menu-title">MAIN MENU</div>

      <NavLink to="/admin" end className="sidebar-link">
        <i className="fa-solid fa-chart-line"></i>
        Dashboard
      </NavLink>

      <NavLink to="/admin/all-users" className="sidebar-link">
        <i className="fa-solid fa-users"></i>
        Users
      </NavLink>

      <NavLink to="/admin/all-groups" className="sidebar-link">
        <i className="fa-solid fa-user-group"></i>
        Groups
      </NavLink>

      <NavLink to="/admin/chat-monitor" className="sidebar-link">
        <i className="fa-solid fa-message"></i>
        Chat Monitor
      </NavLink>

      <div className="menu-title">MODERATION</div>

      <NavLink to="/admin/reported-messages" className="sidebar-link">
        <i className="fa-solid fa-flag"></i>
        Reported Messages
      </NavLink>

      <NavLink to="/admin/reported-users" className="sidebar-link">
        <i className="fa-solid fa-user-shield"></i>
        Reported Users
      </NavLink>

      <NavLink to="/admin/banned-users" className="sidebar-link">
        <i className="fa-solid fa-ban"></i>
        Banned Users
      </NavLink>

      <div className="menu-title">SETTINGS</div>

      <NavLink to="/admin/profile" className="sidebar-link">
        <i className="fa-solid fa-gear"></i>
        Settings
      </NavLink>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSideBar;