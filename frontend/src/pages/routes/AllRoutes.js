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

const AllRoutes = () => {
  const { isAuth } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        <Route
          path="/about"
          element={
            <Layout>
              <About />
            </Layout>
          }
        />

        {/* Login/Register */}
        <Route
          path="/login"
          element={
            isAuth ? (
              <Navigate to="/chat" replace />
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
              <Navigate to="/chat" replace />
            ) : (
               <Layout>
                <Register />
               </Layout>
              
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/chat"
          element={
            isAuth ? (
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
            isAuth ? (
              <Layout>
                <Profile />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />




          <Route path='/admin' element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                    </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AllRoutes;