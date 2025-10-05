// frontend/src/pages/VerifyResetOtp.js - Complete NASA Theme Design
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

function VerifyResetOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const inputRefs = useRef([]);

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  // NASA Satellite Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const satellites = [];

    class WarningSignal {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 30 + 20;
        this.opacity = 1;
        this.speed = 0.5;
      }

      update() {
        this.radius += this.speed;
        this.opacity -= 0.01;
        if (this.opacity <= 0) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.radius = Math.random() * 30 + 20;
          this.opacity = 1;
        }
      }

      draw() {
        ctx.strokeStyle = `rgba(255, 69, 58, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    class Satellite {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = '#0B3D91';
        ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(this.x - 12, this.y - 2, 8, 4);
        ctx.fillRect(this.x + 4, this.y - 2, 8, 4);
        ctx.strokeStyle = 'rgba(253, 184, 30, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 50, this.y + 50);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 5; i++) particles.push(new WarningSignal());
    for (let i = 0; i < 3; i++) satellites.push(new Satellite());

    let animationId;
    function animate() {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      satellites.forEach(s => { s.update(); s.draw(); });
      animationId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Resend Timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      alert("❌ Please enter complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-reset-otp", { 
        email, 
        otp: otpString 
      });
      alert("✅ " + res.data.message);
      navigate(`/reset-password?email=${email}`);
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "OTP verification failed"));
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      alert("✅ New OTP sent to your email!");
      setResendTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      alert("❌ Failed to resend OTP");
    }
  };

  if (!email) {
    return (
      <>
        <style>
          {`
            @keyframes glow {
              0%, 100% { text-shadow: 0 0 20px rgba(255, 69, 58, 0.8); }
              50% { text-shadow: 0 0 40px rgba(255, 69, 58, 1); }
            }
            .glow-text { animation: glow 2s ease-in-out infinite; }
          `}
        </style>
        <div style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <canvas ref={canvasRef} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(15, 20, 40, 0.85)",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                padding: "50px 40px",
                border: "2px solid rgba(255, 69, 58, 0.3)",
                maxWidth: "400px",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⚠️</div>
              <h2 className="glow-text" style={{ color: "#FF4538", fontSize: "1.8rem", marginBottom: "15px" }}>
                Invalid Request
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "25px" }}>
                Email parameter is missing. Please use the link from your email.
              </p>
              <motion.button
                onClick={() => navigate("/forgot-password")}
                style={{
                  padding: "16px 32px",
                  background: "linear-gradient(45deg, #FF4538, #FF6B35)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                🔑 Request Password Reset
              </motion.button>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 69, 58, 0.5); }
            50% { box-shadow: 0 0 40px rgba(255, 69, 58, 0.8); }
          }
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px rgba(255, 69, 58, 0.8); }
            50% { text-shadow: 0 0 40px rgba(255, 69, 58, 1); }
          }
          .pulse-animation { animation: pulse 2s ease-in-out infinite; }
          .glow-text { animation: glow 2s ease-in-out infinite; }
          
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}
      </style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        <canvas ref={canvasRef} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{
              background: "rgba(15, 20, 40, 0.85)",
              backdropFilter: "blur(20px)",
              borderRadius: "20px",
              padding: "50px 40px",
              width: "480px",
              maxWidth: "90vw",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              border: "2px solid rgba(255, 69, 58, 0.3)",
            }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: "4rem", marginBottom: "10px" }}
                  >
                    📧
                  </motion.div>
                  <h2 className="glow-text" style={{
                    color: "#FF4538",
                    fontSize: "2rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }}>
                    Verify Security Code
                  </h2>
                  <p style={{
                    color: "#FDB81E",
                    fontSize: "0.9rem",
                  }}>
                    Password Reset Verification
                  </p>
                  <div style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "rgba(255, 149, 0, 0.1)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 149, 0, 0.3)",
                  }}>
                    <p style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "0.85rem",
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                      📬 We sent a 6-digit code to<br/>
                      <strong style={{ color: "#FF9500" }}>{email}</strong>
                    </p>
                  </div>
                </div>
              </motion.div>

              <form onSubmit={handleVerifyOtp}>
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginBottom: "30px",
                }}>
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      style={{
                        width: "60px",
                        height: "70px",
                        fontSize: "2rem",
                        textAlign: "center",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: `2px solid ${digit ? "#FF9500" : "rgba(255, 69, 58, 0.3)"}`,
                        borderRadius: "12px",
                        color: "#ffffff",
                        outline: "none",
                        transition: "all 0.3s ease",
                        fontWeight: "bold",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#FF4538";
                        e.target.style.boxShadow = "0 0 20px rgba(255, 69, 58, 0.6)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = digit ? "#FF9500" : "rgba(255, 69, 58, 0.3)";
                        e.target.style.boxShadow = "none";
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    />
                  ))}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className={!loading && otp.join('').length === 6 ? "pulse-animation" : ""}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: loading || otp.join('').length !== 6
                      ? "linear-gradient(45deg, #666, #888)"
                      : "linear-gradient(45deg, #FF4538, #FF6B35)",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: loading || otp.join('').length !== 6 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                  whileHover={!loading && otp.join('').length === 6 ? { scale: 1.05 } : {}}
                  whileTap={!loading && otp.join('').length === 6 ? { scale: 0.98 } : {}}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <span>{loading ? "🔄 Verifying..." : "✅ Verify Code"}</span>
                </motion.button>
              </form>

              <div style={{
                marginTop: "25px",
                textAlign: "center",
                padding: "15px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "10px",
              }}>
                <p style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.9rem",
                  marginBottom: "10px",
                }}>
                  Didn't receive the code?
                </p>
                {canResend ? (
                  <motion.button
                    onClick={handleResendOtp}
                    style={{
                      padding: "10px 20px",
                      background: "linear-gradient(45deg, #FF9500, #ffc14d)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🔄 Resend Code
                  </motion.button>
                ) : (
                  <div style={{
                    color: "#FF9500",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                  }}>
                    ⏱️ Resend in {resendTimer}s
                  </div>
                )}
              </div>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <motion.a
                  href="/login"
                  style={{
                    color: "#FF9500",
                    textDecoration: "none",
                    fontSize: "15px",
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  ← Back to Login
                </motion.a>
              </div>

              <div style={{
                marginTop: "25px",
                padding: "15px",
                background: "rgba(255, 69, 58, 0.1)",
                borderRadius: "10px",
                border: "1px solid rgba(255, 69, 58, 0.3)",
              }}>
                <p style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  margin: 0,
                }}>
                  🛰️ Powered by NASA POWER API & Secure Authentication System
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default VerifyResetOtp;
