// src/pages/Home.js
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";

import ManualTriggerForm from "../components/ManualTriggerForm";
import AlertBanner from "../components/AlertBanner";
import MapView from "../components/MapView";
import DisasterDashboard from "../components/DisasterDashboard";

import DISASTER_CONFIG from "../utils/disasterConfig";
import { fetchWeather as fetchWeatherUtil } from "../utils/fetchWeather";
import { getContacts } from "../api/emergency";

const pickMostRecentAvailable = (series) => {
  for (let i = series.length - 1; i >= 0; i--) {
    const d = series[i];
    if (!d) continue;
    if (d.rain != null || d.humidity != null || d.temperature != null) return d;
  }
  return series[series.length - 1] || null;
};

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const canvasRef = useRef(null);

  const [user, setUser] = useState(null);
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  // NASA Satellite + Disaster Alert Animation
  useEffect(() => {
    if (!token) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    const satellites = [];
    const alertPulses = [];

    // Stars
    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * canvas.width;
        this.size = Math.random() * 1.5;
      }

      update() {
        this.z -= 1;
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

    // NASA Satellites
    class Satellite {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = (Math.random() - 0.5) * 1.5;
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

        // Satellite body
        ctx.fillStyle = '#0B3D91';
        ctx.fillRect(-5, -5, 10, 10);
        
        // Solar panels
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(-15, -3, 10, 6);
        ctx.fillRect(5, -3, 10, 6);

        ctx.restore();

        // Signal beam
        ctx.strokeStyle = 'rgba(253, 184, 30, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 80, this.y + 80);
        ctx.stroke();
      }
    }

    // Alert Pulses
    class AlertPulse {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 0;
        this.maxRadius = Math.random() * 50 + 30;
        this.opacity = 1;
        this.speed = 0.8;
        this.color = Math.random() > 0.5 ? '#FF4538' : '#FF9500';
      }

      update() {
        this.radius += this.speed;
        this.opacity -= 0.01;
        
        if (this.opacity <= 0) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.radius = 0;
          this.opacity = 1;
          this.color = Math.random() > 0.5 ? '#FF4538' : '#FF9500';
        }
      }

      draw() {
        ctx.strokeStyle = `${this.color}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Initialize
    for (let i = 0; i < 100; i++) stars.push(new Star());
    for (let i = 0; i < 3; i++) satellites.push(new Satellite());
    for (let i = 0; i < 8; i++) alertPulses.push(new AlertPulse());

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
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [token, navigate]);

  const fetchWeather = useCallback(async (lat, lng) => {
    setLoading(true);
    setLocationError("");
    try {
      const data = await fetchWeatherUtil(lat, lng);
      setWeather(data);
    } catch (e) {
      console.error("Weather fetch error:", e);
      setLocationError("Weather fetch failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setCoords({ latitude, longitude });
        await fetchWeather(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Unable to get your location. Please allow location access.");
      }
    );
  }, [token, fetchWeather]);

  useEffect(() => {
    const checkEmergencyContacts = async () => {
      if (!token) return;

      try {
        const res = await getContacts();
        
        if (!res.data || res.data.length === 0) {
          const shouldRedirect = window.confirm(
            "🚨 CRITICAL: No emergency contacts found! Add contacts now for disaster alerts. Redirect?"
          );
          if (shouldRedirect) {
            navigate("/emergency-contacts");
          }
        }
      } catch (err) {
        console.error("Error checking emergency contacts:", err);
        
        if (err.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    checkEmergencyContacts();
  }, [token, navigate]);

  const handleManualCheck = async () => {
    const latNum = Number(manualLat);
    const lngNum = Number(manualLng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      alert("Enter valid numeric latitude and longitude");
      return;
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      alert("Lat must be -90..90 and Lng -180..180");
      return;
    }
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      setCoords({ latitude: latNum, longitude: lngNum });
      await fetchWeather(latNum, lngNum);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDashboardAlert = (type, level) => {
    const cfg = DISASTER_CONFIG[type];
    if (!cfg) return;
    
    setAlertBanner({
      ...cfg,
      title: `${cfg.title} - ${level.toUpperCase()}`,
      coordinates: coords
        ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        : "-",
      timestamp: new Date().toLocaleString(),
    });
    
    setTimeout(() => setAlertBanner(null), 10000);
  };

  const renderValue = (label, value, unit) => {
    const txt = value == null ? "Data unavailable" : `${value} ${unit ?? ""}`.trim();
    return (
      <>
        <strong>{label}</strong> {txt}
      </>
    );
  };

  const latestAvailable = useMemo(
    () => pickMostRecentAvailable(weather),
    [weather]
  );

  // Styles
  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)",
    position: "relative",
    overflow: "hidden",
  };

  const canvasStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
    opacity: 0.7,
  };

  const contentWrapperStyle = {
    position: "relative",
    zIndex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
  };

  const titleStyle = {
    fontSize: "3rem",
    background: "linear-gradient(45deg, #FF4538, #FF9500, #FDB81E)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center",
  };

  const userInfoStyle = {
    background: "rgba(255, 69, 58, 0.1)",
    backdropFilter: "blur(15px)",
    borderRadius: "15px",
    padding: "25px",
    marginBottom: "30px",
    border: "2px solid rgba(255, 69, 58, 0.3)",
    color: "white",
    textAlign: "center",
    boxShadow: "0 0 30px rgba(255, 69, 58, 0.2)",
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "20px",
  };

  const buttonStyle = (bgColor) => ({
    padding: "12px 24px",
    background: `linear-gradient(45deg, ${bgColor}, ${bgColor}dd)`,
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: `0 4px 15px ${bgColor}40`,
  });

  const cardStyle = {
    background: "rgba(15, 20, 40, 0.8)",
    backdropFilter: "blur(15px)",
    borderRadius: "15px",
    padding: "25px",
    marginBottom: "25px",
    border: "1px solid rgba(255, 69, 58, 0.2)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  };

  const weatherCardStyle = {
    background: "linear-gradient(135deg, rgba(255, 69, 58, 0.15) 0%, rgba(255, 149, 0, 0.1) 100%)",
    backdropFilter: "blur(10px)",
    border: "2px solid rgba(255, 149, 0, 0.3)",
    borderRadius: "15px",
    padding: "20px",
    margin: "15px auto",
    maxWidth: "350px",
    color: "white",
    boxShadow: "0 4px 20px rgba(255, 69, 58, 0.3)",
  };

  // Landing page for non-logged in users
  if (!token) {
    return (
      <div style={pageStyle}>
        <canvas ref={canvasRef} style={canvasStyle} />
        <div style={contentWrapperStyle}>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ fontSize: "5rem", textAlign: "center", marginBottom: "20px" }}
            >
              🛰️
            </motion.div>
            <h1 style={{ ...titleStyle, fontSize: "3.5rem" }}>
              SafeHeaven Alert System
            </h1>
            <p style={{ textAlign: "center", color: "#FF9500", fontSize: "1.3rem", marginBottom: "10px" }}>
              NASA-Powered Disaster Response
            </p>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "1rem", marginBottom: "40px" }}>
              Space Apps Challenge 2025 🌍
            </p>
          </motion.div>

          <motion.div
            style={cardStyle}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 style={{ color: "#FF4538", textAlign: "center", marginBottom: "20px", fontSize: "1.5rem" }}>
              🚨 Emergency Access Portal
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: "30px" }}>
              Monitor disasters in real-time using NASA satellite data
            </p>
            <div style={buttonContainerStyle}>
              <motion.button
                onClick={() => navigate("/login")}
                style={buttonStyle("#FF4538")}
                whileHover={{ scale: 1.05, boxShadow: "0 6px 25px #FF453880" }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 Login to Dashboard
              </motion.button>
              <motion.button
                onClick={() => navigate("/register")}
                style={buttonStyle("#FF9500")}
                whileHover={{ scale: 1.05, boxShadow: "0 6px 25px #FF950080" }}
                whileTap={{ scale: 0.95 }}
              >
                ✨ Register for Alerts
              </motion.button>
            </div>

            <div style={{ margin: "30px 0", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.2)" }}></div>
                <span>OR</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.2)" }}></div>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <motion.button
                onClick={() => (window.location.href = "http://localhost:5000/auth/google")}
                style={buttonStyle("#DB4437")}
                whileHover={{ scale: 1.05, boxShadow: "0 6px 25px #DB443780" }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: "10px", verticalAlign: "middle" }}>
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Quick Access with Google
              </motion.button>
            </div>

            <div style={{
              marginTop: "30px",
              padding: "15px",
              background: "rgba(255, 149, 0, 0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(255, 149, 0, 0.3)",
            }}>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", textAlign: "center", margin: 0 }}>
                🛰️ Real-time data from NASA POWER API | USGS Earthquakes | NWS Tsunami Alerts
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div style={pageStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      
      <div style={contentWrapperStyle}>
        <AlertBanner banner={alertBanner} onClose={() => setAlertBanner(null)} />

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: "4rem", textAlign: "center", marginBottom: "10px" }}
          >
            🛰️
          </motion.div>
          <h1 style={titleStyle}>
            SafeHeaven Alert Dashboard
          </h1>
          <p style={{ textAlign: "center", color: "#FF9500", fontSize: "1.1rem", marginBottom: "30px" }}>
            Real-Time Disaster Monitoring System
          </p>
        </motion.div>

        <motion.div
          style={userInfoStyle}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#FF4538", fontSize: "1.5rem" }}>
            🚨 Active User: {user?.name}
          </h3>
          <p style={{ margin: "0 0 5px 0", opacity: 0.9, fontSize: "0.95rem" }}>
            📧 {user?.email}
          </p>
          <p style={{ margin: "0 0 20px 0", opacity: 0.7, fontSize: "0.85rem" }}>
            🛡️ Emergency alerts enabled
          </p>

          <div style={buttonContainerStyle}>
            <motion.button
              onClick={handleLogout}
              style={buttonStyle("#f44336")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🚪 Exit System
            </motion.button>

            <motion.button
              onClick={() => navigate("/emergency-contacts")}
              style={buttonStyle("#FF9500")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📞 Emergency Contacts
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          style={cardStyle}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 style={{ color: "#FF4538", marginBottom: "20px", textAlign: "center" }}>
            📍 Manual Location Check
          </h3>
          <ManualTriggerForm
            manualLat={manualLat}
            setManualLat={setManualLat}
            manualLng={manualLng}
            setManualLng={setManualLng}
            onSubmit={handleManualCheck}
            submitting={submitting}
          />
        </motion.div>

        {coords && (
          <motion.div
            style={cardStyle}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 style={{ color: "#FF4538", marginBottom: "20px", textAlign: "center" }}>
              🗺️ Your Location
            </h3>
            <MapView
              latitude={coords.latitude}
              longitude={coords.longitude}
              title="Monitoring Location"
              subtitle={`Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`}
            />
          </motion.div>
        )}

        {coords && (
          <motion.div
            style={cardStyle}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <DisasterDashboard
              coords={coords}
              dailyWeather={weather}
              onAlert={handleDashboardAlert}
            />
          </motion.div>
        )}

        <AnimatePresence>
          {loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", color: "#FF9500", fontSize: "1.2rem", fontWeight: "bold" }}
            >
              🛰️ Fetching NASA satellite data...
            </motion.p>
          )}
        </AnimatePresence>

        {locationError && (
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ textAlign: "center", color: "#FF4538", fontSize: "1.1rem", fontWeight: "bold" }}
          >
            ❌ {locationError}
          </motion.p>
        )}

        {weather.length > 0 && (
          <motion.div
            style={cardStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 style={{ color: "#FF4538", marginBottom: "15px", textAlign: "center", fontSize: "1.8rem" }}>
              📊 NASA POWER API - Weather Data
            </h2>
            {latestAvailable?.date && (
              <p style={{ textAlign: "center", color: "#FF9500", marginBottom: "25px", fontSize: "1rem" }}>
                📅 Latest: {latestAvailable.date}
              </p>
            )}
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" }}>
              {weather.map((day, index) => (
                <motion.div
                  key={day.date}
                  style={weatherCardStyle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 6px 30px rgba(255, 69, 58, 0.5)" }}
                >
                  <div style={{ fontSize: "1.1rem", marginBottom: "15px", borderBottom: "2px solid rgba(255,149,0,0.3)", paddingBottom: "10px" }}>
                    📅 <strong>{day.date}</strong>
                  </div>
                  <div style={{ fontSize: "0.95rem", lineHeight: "2" }}>
                    <div>🌡️ {renderValue("Temp:", day.temperature, "°C")}</div>
                    <div>💧 {renderValue("Humidity:", day.humidity, "%")}</div>
                    <div>🌧️ {renderValue("Rain:", day.rain, "mm")}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!loading && weather.length === 0 && coords && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "1.1rem" }}
          >
            No weather data available for the last 5 days.
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default Home;
