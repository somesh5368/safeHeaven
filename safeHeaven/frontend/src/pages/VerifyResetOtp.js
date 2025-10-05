// frontend/src/pages/VerifyResetOtp.js

import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function VerifyResetOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-reset-otp", { email, otp });
      alert(res.data.message);
      navigate(`/reset-password?email=${email}`);
    } catch (err) {
      alert(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Verify OTP for Password Reset</h2>
      <form onSubmit={handleVerifyOtp}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        /><br /><br />
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}

export default VerifyResetOtp;
