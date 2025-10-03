// frontend/src/pages/Register.js
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // NASA Satellite + Alert Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    const satellites = [];
    const alertPulses = [];

    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * canvas.width;
        this.size = Math.random() * 1.5;
      }

      update() {
        this.z -= 1.5;
        if (this.z <= 0) {
          this.z = canvas.width;
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
        }
      }

      draw() {
        const x = (this.x - canvas.width / 2) * (canvas.width / this.z);
        const y = (this.y - canvas.height / 2) * (canvas.width / this.z);
        const s = this.size * (canvas.width / this.z);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + x, canvas.height / 2 + y, s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class Satellite {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speedX = (Math.random() - 0.5) * 1;
        this.speedY = (Math.random() - 0.5) * 1;
        this.angle = 0;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += 0.02;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = '#0B3D91';
        ctx.fillRect(-4, -4, 8, 8);
        
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(-12, -2, 8, 4);
        ctx.fillRect(4, -2, 8, 4);

        ctx.restore();

        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 60, this.y + 60);
        ctx.stroke();
      }
    }

    class AlertPulse {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 0;
        this.maxRadius = Math.random() * 40 + 30;
        this.opacity = 1;
        this.speed = 0.6;
        this.color = '#4CAF50';
      }

      update() {
        this.radius += this.speed;
        this.opacity -= 0.008;
        
        if (this.opacity <= 0) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.radius = 0;
          this.opacity = 1;
        }
      }

      draw() {
        ctx.strokeStyle = `${this.color}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 120; i++) stars.push(new Star());
    for (let i = 0; i < 2; i++) satellites.push(new Satellite());
    for (let i = 0; i < 6; i++) alertPulses.push(new AlertPulse());

    let animationId;
    function animate() {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        star.update();
        star.draw();
      });

      alertPulses.forEach(pulse => {
        pulse.update();
        pulse.draw();
      });

      satellites.forEach(sat => {
        sat.update();
        sat.draw();
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      setTimeout(() => {
        alert(res.data.message || "✅ OTP sent to your email. Please verify.");
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        setIsRegistering(false);
      }, 1200);
    } catch (err) {
      setIsRegistering(false);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <>
      <style>
        {`
          @keyframes glow {
            0%, 100% {
              text-shadow: 0 0 20px rgba(76, 175, 80, 0.8), 0 0 40px rgba(76, 175, 80, 0.4);
            }
            50% {
              text-shadow: 0 0 30px rgba(76, 175, 80, 1), 0 0 60px rgba(76, 175, 80, 0.6);
            }
          }

          input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          .glow-title {
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
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
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
              border: "2px solid rgba(76, 175, 80, 0.3)",
            }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ fontSize: "4rem", marginBottom: "10px" }}
                  >
                    🛰️
                  </motion.div>
                  <h2 style={{
                    color: "#4CAF50",
                    fontSize: "2rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }} className="glow-title">
                    Join SafeHeaven
                  </h2>
                  <p style={{
                    color: "#FF9500",
                    fontSize: "0.9rem",
                  }}>
                    NASA-Powered Disaster Alert System
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.85rem",
                    marginTop: "8px",
                  }}>
                    Space Apps Challenge 2025
                  </p>
                </div>
              </motion.div>

              <form onSubmit={handleRegister}>
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <input
                    type="text"
                    placeholder="👤 Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "16px",
                      marginBottom: "20px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "2px solid rgba(76, 175, 80, 0.3)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4CAF50";
                      e.target.style.boxShadow = "0 0 20px rgba(76, 175, 80, 0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(76, 175, 80, 0.3)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <input
                    type="email"
                    placeholder="📧 Emergency Contact Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "16px",
                      marginBottom: "20px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "2px solid rgba(76, 175, 80, 0.3)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4CAF50";
                      e.target.style.boxShadow = "0 0 20px rgba(76, 175, 80, 0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(76, 175, 80, 0.3)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <input
                    type="password"
                    placeholder="🔒 Secure Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                    style={{
                      width: "100%",
                      padding: "16px",
                      marginBottom: "20px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "2px solid rgba(76, 175, 80, 0.3)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4CAF50";
                      e.target.style.boxShadow = "0 0 20px rgba(76, 175, 80, 0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(76, 175, 80, 0.3)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isRegistering}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: isRegistering
                      ? "linear-gradient(45deg, #666, #888)"
                      : "linear-gradient(45deg, #4CAF50, #45a049)",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: isRegistering ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    boxShadow: "0 4px 15px rgba(76, 175, 80, 0.4)",
                  }}
                  whileHover={!isRegistering ? { scale: 1.05 } : {}}
                  whileTap={!isRegistering ? { scale: 0.98 } : {}}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <span>{isRegistering ? "Registering..." : "🛡️ Create Account"}</span>
                  {isRegistering && (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ fontSize: "20px" }}
                    >
                      🛰️
                    </motion.span>
                  )}
                </motion.button>
              </form>

              <div style={{
                display: "flex",
                alignItems: "center",
                margin: "25px 0",
                color: "rgba(255,255,255,0.5)",
              }}>
                <div style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.2)" }}></div>
                <span style={{ padding: "0 15px", fontSize: "14px" }}>OR</span>
                <div style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.2)" }}></div>
              </div>

              <motion.button
                onClick={handleGoogleRegister}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "linear-gradient(45deg, #DB4437, #E57373)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Quick Register with Google</span>
              </motion.button>

              <div style={{ marginTop: "25px", textAlign: "center" }}>
                <motion.a
                  href="/login"
                  style={{
                    color: "#4A90E2",
                    textDecoration: "none",
                    fontSize: "15px",
                  }}
                  whileHover={{ scale: 1.05 }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#4CAF50";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#4A90E2";
                  }}
                >
                  Already registered? Access System 🚀
                </motion.a>
              </div>

              <div style={{
                marginTop: "30px",
                padding: "15px",
                background: "rgba(76, 175, 80, 0.1)",
                borderRadius: "10px",
                border: "1px solid rgba(76, 175, 80, 0.3)",
              }}>
                <p style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  margin: 0,
                }}>
                  🛰️ Register to receive real-time disaster alerts via NASA satellite data
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default Register;
