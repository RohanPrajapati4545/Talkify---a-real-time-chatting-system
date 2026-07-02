import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


import Login from "./../../pages/auth/Login";
import Register from "./../../pages/auth/Register";

import MyGroups from "../MyGroups";
import { useSelector } from "react-redux";
import Profile from "../Profile";

const AllRoutes = () => {
    const { isAuth } = useSelector((state) => state.auth);
  return (
    <BrowserRouter>
      <Routes>
     

        
        <Route
          path="/register"
          element={
         
                  <Register />
          
          
           
          }
        />

        <Route
          path="/login"
          element={
            !isAuth ?   <Login /> : <Navigate to="/" />
            
              
          
          }
        />
        
          <Route
          path="/"
          element={
           
         
  isAuth ? <MyGroups /> : <Navigate to="/login" />}          
        />

         <Route
          path="/profile"
          element={
           isAuth ?  <Profile /> : <Navigate to="/login" />
            
               
          
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AllRoutes;