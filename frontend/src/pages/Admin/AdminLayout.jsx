import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSideBar from "../../components/AdminSideBar";
import AdminFooter from "./AdminFooter";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="admin-layout">
      <div className="admin-body">

        {/* Hamburger toggle — visible on ALL screen sizes now */}
        <button
          className="admin-hamburger-btn"
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <i className={`fa-solid ${sidebarOpen ? "fa-xmark" : "fa-bars"}`}></i>
        </button>

        {/* Backdrop for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="admin-sidebar-backdrop d-md-none"
            onClick={toggleSidebar}
          ></div>
        )}

        <div className={`admin-sidebar-wrap ${sidebarOpen ? "open" : "closed"}`}>
          <AdminSideBar />
        </div>

        <div className={`admin-content ${sidebarOpen ? "" : "full"}`}>
          <Outlet />
        </div>

      </div>

      <AdminFooter />
    </div>
  );
};

export default AdminLayout;