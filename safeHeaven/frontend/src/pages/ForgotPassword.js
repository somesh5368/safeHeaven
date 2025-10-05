// frontend/src/pages/ForgotPassword.js - Complete NASA Theme Design
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      alert("✅ " + res.data.message);
      navigate(`/verify-reset-otp?email=${email}`);
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 0 20px rgba(255, 69, 58, 0.5);
            }
            50% {
              box-shadow: 0 0 40px rgba(255, 69, 58, 0.8);
            }
          }

          @keyframes glow {
            0%, 100% {
              text-shadow: 0 0 20px rgba(255, 69, 58, 0.8);
            }
            50% {
              text-shadow: 0 0 40px rgba(255, 69, 58, 1);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          .pulse-animation {
            animation: pulse 2s ease-in-out infinite;
          }

          .glow-text {
            animation: glow 2s ease-in-out infinite;
          }

          .float-animation {
            animation: float 3s ease-in-out infinite;
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
              width: "420px",
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
                    className="float-animation"
                    style={{ fontSize: "4rem", marginBottom: "10px" }}
                  >
                    🔑
                  </motion.div>
                  <h2 style={{
                    color: "#FF4538",
                    fontSize: "2rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }} className="glow-text">
                    Reset Access Code
                  </h2>
                  <p style={{
                    color: "#FDB81E",
                    fontSize: "0.9rem",
                  }}>
                    Password Recovery System
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.85rem",
                    marginTop: "12px",
                    lineHeight: 1.5,
                  }}>
                    Enter your registered email address and we'll send you a secure verification code
                  </p>
                </div>
              </motion.div>

              <form onSubmit={handleForgotPassword}>
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div style={{
                    marginBottom: "8px",
                    color: "#FF9500",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    paddingLeft: "5px",
                  }}>
                    📧 Email Address
                  </div>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "16px",
                      marginBottom: "25px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "2px solid rgba(255, 69, 58, 0.3)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#FF4538";
                      e.target.style.boxShadow = "0 0 20px rgba(255, 69, 58, 0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 69, 58, 0.3)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className={!loading ? "pulse-animation" : ""}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: loading
                      ? "linear-gradient(45deg, #666, #888)"
                      : "linear-gradient(45deg, #FF4538, #FF6B35)",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                  whileHover={!loading ? { scale: 1.05 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <span>{loading ? "📤 Sending Code..." : "📨 Send Verification Code"}</span>
                </motion.button>
              </form>

              <div style={{
                marginTop: "30px",
                padding: "20px",
                background: "rgba(255, 149, 0, 0.1)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 149, 0, 0.3)",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "start",
                  gap: "12px",
                  marginBottom: "12px",
                }}>
                  <span style={{ fontSize: "1.5rem" }}>🛡️</span>
                  <div>
                    <div style={{
                      color: "#FF9500",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      marginBottom: "5px",
                    }}>
                      Security Notice
                    </div>
                    <p style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "0.8rem",
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                      A 6-digit verification code will be sent to your email. This code is valid for 10 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: "25px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                textAlign: "center",
              }}>
                <motion.a
                  href="/login"
                  style={{
                    color: "#FF9500",
                    textDecoration: "none",
                    fontSize: "15px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span>←</span>
                  <span>Back to Login</span>
                </motion.a>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "10px 0",
                  color: "rgba(255,255,255,0.3)",
                }}>
                  <div style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.2)" }}></div>
                  <span style={{ padding: "0 15px", fontSize: "12px" }}>OR</span>
                  <div style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.2)" }}></div>
                </div>

                <motion.a
                  href="/register"
                  style={{
                    color: "#FF4538",
                    textDecoration: "none",
                    fontSize: "15px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span>🆕</span>
                  <span>Create New Account</span>
                </motion.a>
              </div>

              <div style={{
                marginTop: "30px",
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

export default ForgotPassword;
