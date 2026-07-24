import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Login from "../../pages/auth/Login";
import Register from "../../pages/auth/Register";
import Home from "../Home";
import About from "../About";
import MyGroups from "../MyGroups";
import Profile from "../Profile";
import Layout from "./Layout";
import AdminLayout from "../Admin/AdminLayout";
import Dashboard from "../Admin/Dashboard";
import AdminProfile from "../Admin/AdminProfile";
import AllUsers from "../Admin/AllUsers";
import AllGroups from "../Admin/AllGroups";
import ChatMonitor from "../Admin/ChatMonitor";
import AllCallRecords from "../Admin/AllCallRecords";
import GroupMembers from "../Admin/GroupMembers";
import Contact from "../Contact";

const AllRoutes = () => {
  const { isAuth, user } = useSelector((state) => state.auth);
  const isAdmin = isAuth && user?.role === "admin";

  // where a logged-in user should land if they hit /login or /register again
  const homeForUser = isAdmin ? "/admin" : "/chat";

  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages — admin never sees these, always bounced to /admin */}
        <Route
          path="/"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Layout>
                <Home />
              </Layout>
            )
          }
        />

        <Route
          path="/about"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Layout>
                <About />
              </Layout>
            )
          }
        />
          <Route
          path="/contact"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Layout>
                <Contact />
              </Layout>
            )
          }
        />

        {/* Login/Register */}
        <Route
          path="/login"
          element={
            isAuth ? (
              <Navigate to={homeForUser} replace />
            ) : (
              <Layout>
                <Login />
              </Layout>
            )
          }
        />

        <Route
          path="/register"
          element={
            isAuth ? (
              <Navigate to={homeForUser} replace />
            ) : (
              <Layout>
                <Register />
              </Layout>
            )
          }
        />

        {/* Protected Routes — admin never sees these, always bounced to /admin */}
        <Route
          path="/chat"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isAuth ? (
              <Layout>
                <MyGroups />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isAuth ? (
              <Layout>
                <Profile />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Admin Routes — guarded: must be authenticated AND role === "admin" */}
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminLayout />
            ) : isAuth ? (
              <Navigate to="/chat" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="all-users" element={<AllUsers />} />
          <Route path="all-groups" element={<AllGroups />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="chat-monitor" element={<ChatMonitor />} />
          <Route path="call-records" element={<AllCallRecords />} />
          <Route path="/admin/groups/:groupId/members" element={<GroupMembers />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAdmin ? "/admin" : "/"} replace />}
        />

      </Routes>
    </BrowserRouter>
  );
};

export default AllRoutes;