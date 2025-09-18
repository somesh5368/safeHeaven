// frontend/src/pages/Login.js
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // ✅ Save token
      localStorage.setItem("token", res.data.token);

      alert("Login successful");
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";

      if (message.includes("verify your email")) {
        alert("⚠️ Please verify your email before login.");
        // Redirect to OTP page with email
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        alert(message);
      }
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <br />
        <button type="submit">Login</button>
      </form>
      <br></br>
      <a href="/forgot-password">Forgot Password?</a>
    </div>
  );
}

export default Login;
