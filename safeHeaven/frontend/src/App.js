// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import GoogleSuccess from "./pages/GoogleSuccess";
import VerifyOtp from "./pages/VerifyOtp"; // ✅ import VerifyOtp
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOtp from "./pages/VerifyResetOtp";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Google OAuth Success Route */}
        <Route path="/google-success" element={<GoogleSuccess />} />
        {/* ✅ New route for OTP verification */}
        <Route path="/verify-otp" element={<VerifyOtp />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
