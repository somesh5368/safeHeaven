// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import GoogleSuccess from "./pages/GoogleSuccess";
import VerifyOtp from "./pages/VerifyOtp"; // ✅ import VerifyOtp

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
      </Routes>
    </Router>
  );
}

export default App;
