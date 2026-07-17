import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSideBar from "../../components/AdminSideBar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
   
      <div className="desktop-sidebar d-none d-md-block">
        <AdminSideBar />
      </div>

      
      {!sidebarOpen && (
        <button
          className="btn btn-light d-md-none position-fixed"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminSidebar"
          onClick={() => setSidebarOpen(true)}
          style={{
            top: "15px",
            left: "15px",
            zIndex: 1050,
          }}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      )}

    
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="adminSidebar"
        onHidden={() => setSidebarOpen(false)}
      >
        <div className="offcanvas-header">
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            onClick={() => setSidebarOpen(false)}
          ></button>
        </div>

        <div className="offcanvas-body p-0">
          <AdminSideBar />
        </div>
      </div>

 
      <div
        className="admin-content"
        
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;