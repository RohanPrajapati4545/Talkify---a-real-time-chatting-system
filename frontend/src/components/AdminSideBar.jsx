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

     <NavLink to="/admin/call-records" className="sidebar-link">
  <i className="fa-solid fa-phone-volume"></i>
  Call Records
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