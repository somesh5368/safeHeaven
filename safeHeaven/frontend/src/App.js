// src/App.js

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Import axios config to initialize interceptors
import "./api/axiosConfig";

// Pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import GoogleSuccess from "./pages/GoogleSuccess";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOtp from "./pages/VerifyResetOtp";
import ResetPassword from "./pages/ResetPassword";
import EmergencyContacts from "./components/EmergencyContacts";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  // Check token expiry on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        
        if (Date.now() >= expiryTime) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          console.log("Token expired, redirecting to login");
        }
      } catch (error) {
        console.error("Invalid token format:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes - No auth required */}
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Google OAuth Success Route */}
        <Route path="/google-success" element={<GoogleSuccess />} />

        {/* Protected Routes - Auth required */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/emergency-contacts" 
          element={
            <ProtectedRoute>
              <EmergencyContacts />
            </ProtectedRoute>
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
