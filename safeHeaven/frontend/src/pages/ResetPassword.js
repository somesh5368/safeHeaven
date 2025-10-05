// src/pages/ResetPassword.js - NASA Theme (Matching Login Design)
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  // NASA Satellite Animation (Same as Login)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const satellites = [];

    // Warning signals
    class WarningSignal {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 30 + 20;
        this.maxRadius = this.radius;
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
          this.maxRadius = this.radius;
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

    // NASA Satellites
    class Satellite {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 8;
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

    for (let i = 0; i < 5; i++) {
      particles.push(new WarningSignal());
    }
    for (let i = 0; i < 3; i++) {
      satellites.push(new Satellite());
    }

    let animationId;
    function animate() {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      satellites.forEach(s => {
        s.update();
        s.draw();
      });

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

  // Password strength calculator
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (newPassword.length >= 12) strength += 25;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength += 25;
    if (/\d/.test(newPassword)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength += 10;
    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  const getStrengthColor = () => {
    if (passwordStrength < 25) return '#FF4538';
    if (passwordStrength < 50) return '#FF9500';
    if (passwordStrength < 75) return '#FFD60A';
    return '#34C759';
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      alert("❌ Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        newPassword,
      });
      alert("✅ " + res.data.message);
      navigate("/login");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Password reset failed"));
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <>
        <style>
          {`
            @keyframes glow {
              0%, 100% {
                text-shadow: 0 0 20px rgba(255, 69, 58, 0.8);
              }
              50% {
                text-shadow: 0 0 40px rgba(255, 69, 58, 1);
              }
            }
            .glow-text {
              animation: glow 2s ease-in-out infinite;
            }
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
              transition={{ duration: 0.5 }}
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
                Invalid Link
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "25px" }}>
                The password reset link is invalid or has expired.
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
                🔑 Request New Link
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

          input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          .pulse-animation {
            animation: pulse 2s ease-in-out infinite;
          }

          .glow-text {
            animation: glow 2s ease-in-out infinite;
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
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: "4rem", marginBottom: "10px" }}
                  >
                    🔐
                  </motion.div>
                  <h2 className="glow-text" style={{
                    color: "#FF4538",
                    fontSize: "2rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }}>
                    Reset Access Code
                  </h2>
                  <p style={{
                    color: "#FDB81E",
                    fontSize: "0.9rem",
                  }}>
                    Secure Your Emergency Access
                  </p>
                  <div style={{
                    marginTop: "15px",
                    padding: "10px",
                    background: "rgba(255, 69, 58, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 69, 58, 0.3)",
                  }}>
                    <p style={{
                      color: "#FF9500",
                      fontSize: "0.85rem",
                      margin: 0,
                    }}>
                      📧 Resetting for: <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              </motion.div>

              <form onSubmit={handleResetPassword}>
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="🔒 New Access Code"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "16px 45px 16px 16px",
                        marginBottom: "10px",
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
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "16px",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        userSelect: "none",
                      }}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </div>

                  {newPassword && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginBottom: "15px" }}
                      >
                        <div style={{
                          height: "8px",
                          background: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          overflow: "hidden",
                          marginBottom: "5px",
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${passwordStrength}%`,
                            background: getStrengthColor(),
                            transition: "all 0.3s ease",
                            borderRadius: "10px",
                          }} />
                        </div>
                        <div style={{
                          color: getStrengthColor(),
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}>
                          🔐 Strength: {getStrengthText()}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>

                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="🔒 Confirm Access Code"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "16px",
                      marginBottom: "20px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: `2px solid ${
                        confirmPassword && newPassword !== confirmPassword
                          ? "#FF4538"
                          : "rgba(255, 69, 58, 0.3)"
                      }`,
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.boxShadow = "0 0 20px rgba(255, 69, 58, 0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  {confirmPassword && (
                    <div style={{
                      fontSize: "0.85rem",
                      color: newPassword === confirmPassword ? "#34C759" : "#FF4538",
                      marginTop: "-15px",
                      marginBottom: "15px",
                    }}>
                      {newPassword === confirmPassword ? "✅ Passwords match" : "❌ Passwords don't match"}
                    </div>
                  )}
                </motion.div>

                <div style={{
                  background: "rgba(255, 149, 0, 0.1)",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "20px",
                  border: "1px solid rgba(255, 149, 0, 0.3)",
                }}>
                  <div style={{ color: "#FF9500", fontWeight: "600", marginBottom: "10px", fontSize: "0.9rem" }}>
                    🔐 Security Requirements:
                  </div>
                  <div style={{
                    color: newPassword.length >= 8 ? "#34C759" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                  }}>
                    {newPassword.length >= 8 ? "✅" : "○"} At least 8 characters
                  </div>
                  <div style={{
                    color: /[A-Z]/.test(newPassword) ? "#34C759" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                  }}>
                    {/[A-Z]/.test(newPassword) ? "✅" : "○"} One uppercase letter
                  </div>
                  <div style={{
                    color: /[a-z]/.test(newPassword) ? "#34C759" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                  }}>
                    {/[a-z]/.test(newPassword) ? "✅" : "○"} One lowercase letter
                  </div>
                  <div style={{
                    color: /\d/.test(newPassword) ? "#34C759" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                  }}>
                    {/\d/.test(newPassword) ? "✅" : "○"} One number
                  </div>
                  <div style={{
                    color: /[^a-zA-Z0-9]/.test(newPassword) ? "#34C759" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.85rem",
                  }}>
                    {/[^a-zA-Z0-9]/.test(newPassword) ? "✅" : "○"} One special character
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className={!loading && newPassword === confirmPassword ? "pulse-animation" : ""}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: loading || newPassword !== confirmPassword
                      ? "linear-gradient(45deg, #666, #888)"
                      : "linear-gradient(45deg, #FF4538, #FF6B35)",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: loading || newPassword !== confirmPassword ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                  whileHover={!loading && newPassword === confirmPassword ? { scale: 1.05 } : {}}
                  whileTap={!loading && newPassword === confirmPassword ? { scale: 0.98 } : {}}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <span>{loading ? "🔄 Securing..." : "🔐 Reset Access Code"}</span>
                </motion.button>
              </form>

              <div style={{ marginTop: "25px", textAlign: "center" }}>
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

export default ResetPassword;
