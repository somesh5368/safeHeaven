// frontend/src/pages/VerifyOtp.js
import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Email not found. Please register again.");
      navigate("/register");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      // ✅ Save token for auto-login
      localStorage.setItem("token", res.data.token);

      alert(res.data.message);

      // ✅ Redirect straight to home
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Resend OTP function
  const handleResendOtp = async () => {
    if (!email) return alert("Email not found. Please register again.");

    setResendLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/resend-otp", { email });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Email Verification</h2>
      <p>We sent an OTP to <b>{email}</b>. Please enter it below:</p>

      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <br />
      <button onClick={handleResendOtp} disabled={resendLoading}>
        {resendLoading ? "Resending..." : "Resend OTP"}
      </button>
    </div>
  );
}

export default VerifyOtp;
