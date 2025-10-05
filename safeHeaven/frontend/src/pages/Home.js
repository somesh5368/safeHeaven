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
import { evaluateHazards } from "../utils/hazardRules";

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

  // EONET filters
  const [eonetCategory, setEonetCategory] = useState("earthquakes");
  const [eonetStatus, setEonetStatus] = useState("open");
  const [eonetDays, setEonetDays] = useState(14);
  const [eonetLimit, setEonetLimit] = useState(200);
  const [autoRefreshSec, setAutoRefreshSec] = useState(180);

  // Raw EONET features used for evaluation
  const [eonetRaw, setEonetRaw] = useState([]);

  // Background animation (unchanged, omitted for brevity; keep your existing implementation)
  useEffect(() => {
    if (!token) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const stars = [], satellites = [], alertPulses = [];
    class Star { constructor(){ this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.z=Math.random()*canvas.width; this.size=Math.random()*1.5; }
      update(){ this.z-=1; if(this.z<=0){ this.z=canvas.width; this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; } }
      draw(){ const x=(this.x-canvas.width/2)*(canvas.width/this.z); const y=(this.y-canvas.height/2)*(canvas.width/this.z); const s=this.size*(canvas.width/this.z); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(canvas.width/2+x, canvas.height/2+y, s, 0, Math.PI*2); ctx.fill(); } }
    class Satellite { constructor(){ this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.speedX=(Math.random()-0.5)*1.5; this.speedY=(Math.random()-0.5)*1.5; this.angle=0; }
      update(){ this.x+=this.speedX; this.y+=this.speedY; this.angle+=0.02; if(this.x<0||this.x>canvas.width) this.speedX*=-1; if(this.y<0||this.y>canvas.height) this.speedY*=-1; }
      draw(){ ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.angle); ctx.fillStyle='#0B3D91'; ctx.fillRect(-5,-5,10,10); ctx.fillStyle='#4A90E2'; ctx.fillRect(-15,-3,10,6); ctx.fillRect(5,-3,10,6); ctx.restore(); ctx.strokeStyle='rgba(253, 184, 30, 0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(this.x,this.y); ctx.lineTo(this.x+80,this.y+80); ctx.stroke(); } }
    class AlertPulse { constructor(){ this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.radius=0; this.maxRadius=Math.random()*50+30; this.opacity=1; this.speed=0.8; this.color=Math.random()>0.5?'#FF4538':'#FF9500'; }
      update(){ this.radius+=this.speed; this.opacity-=0.01; if(this.opacity<=0){ this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.radius=0; this.opacity=1; this.color=Math.random()>0.5?'#FF4538':'#FF9500'; } }
      draw(){ ctx.strokeStyle=`${this.color}${Math.floor(this.opacity*255).toString(16).padStart(2,'0')}`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.stroke(); } }
    for (let i=0;i<100;i++) stars.push(new Star());
    for (let i=0;i<3;i++) satellites.push(new Satellite());
    for (let i=0;i<8;i++) alertPulses.push(new AlertPulse());
    let animationId;
    const animate=()=>{ ctx.fillStyle='rgba(10,14,39,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height); stars.forEach(s=>{s.update(); s.draw();}); alertPulses.forEach(p=>{p.update(); p.draw();}); satellites.forEach(s=>{s.update(); s.draw();}); animationId=requestAnimationFrame(animate); };
    animate();
    const onResize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    window.addEventListener('resize', onResize);
    return ()=>{ window.removeEventListener('resize', onResize); cancelAnimationFrame(animationId); };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    try { const decoded = jwtDecode(token); setUser(decoded); }
    catch (error) { console.error("Invalid token:", error); localStorage.removeItem("token"); navigate("/login"); }
  }, [token, navigate]);

  const fetchWeather = useCallback(async (lat, lng) => {
    setLoading(true); setLocationError("");
    try { const data = await fetchWeatherUtil(lat, lng); setWeather(data); }
    catch (e) { console.error("Weather fetch error:", e); setLocationError("Weather fetch failed. Try again."); }
    finally { setLoading(false); }
  }, []);

  // EONET nearby fetch for evaluation — broadened bbox for testing
  const loadEonetForEval = useCallback(async (lat, lon) => {
    try {
      const pad = 5.0; // broader for testing; reduce to 2.5 after verifying alerts
      const minLon = lon - pad, maxLon = lon + pad;
      const minLat = lat - pad, maxLat = lat + pad;
      const bbox = `${minLon},${maxLat},${maxLon},${minLat}`; // EONET order
      const url = new URL("https://eonet.gsfc.nasa.gov/api/v3/events/geojson");
      const qp = new URLSearchParams({
        status: "all",           // broader for testing; restore to eonetStatus after verification
        days: String(Math.max(30, eonetDays)),
        limit: String(Math.max(500, eonetLimit)),
        // category: omit during testing to allow all hazards; restore eonetCategory after verification
        bbox
      });
      url.search = qp.toString();
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error(`EONET ${r.status}`);
      const geo = await r.json();
      setEonetRaw(Array.isArray(geo?.features) ? geo.features : []);
      console.log("EONET eval features:", geo?.features?.length, "bbox:", bbox);
    } catch (e) {
      console.error("EONET eval fetch error", e);
      setEonetRaw([]);
    }
  }, [eonetDays, eonetLimit]);

  useEffect(() => {
    if (!token) return;
    if (!navigator.geolocation) { setLocationError("Geolocation is not supported by your browser."); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setCoords({ latitude, longitude });
        await fetchWeather(latitude, longitude);
        await loadEonetForEval(latitude, longitude);
      },
      (error) => { console.error("Geolocation error:", error); setLocationError("Unable to get your location. Please allow location access."); }
    );
  }, [token, fetchWeather, loadEonetForEval]);

  useEffect(() => {
    const checkEmergencyContacts = async () => {
      if (!token) return;
      try {
        const res = await getContacts();
        if (!res.data || res.data.length === 0) {
          const shouldRedirect = window.confirm("🚨 CRITICAL: No emergency contacts found! Add contacts now for disaster alerts. Redirect?");
          if (shouldRedirect) navigate("/emergency-contacts");
        }
      } catch (err) {
        console.error("Error checking emergency contacts:", err);
        if (err.response?.status === 401) navigate("/login");
      }
    };
    checkEmergencyContacts();
  }, [token, navigate]);

  const handleManualCheck = async () => {
    const latNum = Number(manualLat);
    const lngNum = Number(manualLng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) { alert("Enter valid numeric latitude and longitude"); return; }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) { alert("Lat must be -90..90 and Lng -180..180"); return; }
    if (!token) { alert("Please login first"); navigate("/login"); return; }
    setSubmitting(true);
    try {
      setCoords({ latitude: latNum, longitude: lngNum });
      await fetchWeather(latNum, lngNum);
      await loadEonetForEval(latNum, lngNum);
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDashboardAlert = useCallback((type, level) => {
    const cfg = DISASTER_CONFIG[type];
    if (!cfg) return;
    setAlertBanner({
      ...cfg,
      title: `${cfg.title} - ${level.toUpperCase()}`,
      coordinates: coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : "-",
      timestamp: new Date().toLocaleString(),
    });
    setTimeout(() => setAlertBanner(null), 10000);
  }, [coords]);

  // Evaluate EONET → alerts with debug logging
  useEffect(() => {
    if (!coords || !eonetRaw.length) return;
    const result = evaluateHazards({ coords, eonetFeatures: eonetRaw });
    console.log("Eval result:", result, "features:", eonetRaw.length, "coords:", coords);
    if (result.level === "warning" || result.level === "critical") {
      handleDashboardAlert(result.type, result.level);
    }
  }, [coords, eonetRaw, handleDashboardAlert]);

  const renderValue = (label, value, unit) => {
    const txt = value == null ? "Data unavailable" : `${value} ${unit ?? ""}`.trim();
    return (<><strong>{label}</strong> {txt}</>);
  };

  const latestAvailable = useMemo(() => pickMostRecentAvailable(weather), [weather]);

  // Styles (unchanged, keep your existing inline styles)
  const pageStyle = { minHeight: "100vh", background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)", position: "relative", overflow: "hidden" };
  const canvasStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.7 };
  const contentWrapperStyle = { position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" };
  const titleStyle = { fontSize: "3rem", background: "linear-gradient(45deg, #FF4538, #FF9500, #FDB81E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: "bold", marginBottom: "10px", textAlign: "center" };
  const userInfoStyle = { background: "rgba(255, 69, 58, 0.1)", backdropFilter: "blur(15px)", borderRadius: "15px", padding: "25px", marginBottom: "30px", border: "2px solid rgba(255, 69, 58, 0.3)", color: "white", textAlign: "center", boxShadow: "0 0 30px rgba(255, 69, 58, 0.2)" };
  const buttonContainerStyle = { display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" };
  const buttonStyle = (bgColor) => ({ padding: "12px 24px", background: `linear-gradient(45deg, ${bgColor}, ${bgColor}dd)`, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "16px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: `0 4px 15px ${bgColor}40` });
  const cardStyle = { background: "rgba(15, 20, 40, 0.8)", backdropFilter: "blur(15px)", borderRadius: "15px", padding: "25px", marginBottom: "25px", border: "1px solid rgba(255, 69, 58, 0.2)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" };
  const weatherCardStyle = { background: "linear-gradient(135deg, rgba(255, 69, 58, 0.15) 0%, rgba(255, 149, 0, 0.1) 100%)", backdropFilter: "blur(10px)", border: "2px solid rgba(255, 149, 0, 0.3)", borderRadius: "15px", padding: "20px", margin: "15px auto", maxWidth: "350px", color: "white", boxShadow: "0 4px 20px rgba(255, 69, 58, 0.3)" };

  if (!token) {
    return (
      <div style={pageStyle}>
        <canvas ref={canvasRef} style={canvasStyle} />
        <div style={contentWrapperStyle}>{/* public landing */}</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />

      <div style={contentWrapperStyle}>
        <AlertBanner banner={alertBanner} onClose={() => setAlertBanner(null)} />

        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: "4rem", textAlign: "center", marginBottom: "10px" }}>🛰️</motion.div>
          <h1 style={titleStyle}>SafeHeaven Alert Dashboard</h1>
          <p style={{ textAlign: "center", color: "#FF9500", fontSize: "1.1rem", marginBottom: "30px" }}>Real-Time Disaster Monitoring System</p>
        </motion.div>

        <motion.div style={userInfoStyle} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#FF4538", fontSize: "1.5rem" }}>🚨 Active User: {user?.name}</h3>
          <p style={{ margin: "0 0 5px 0", opacity: 0.9, fontSize: "0.95rem" }}>📧 {user?.email}</p>
          <p style={{ margin: "0 0 20px 0", opacity: 0.7, fontSize: "0.85rem" }}>🛡️ Emergency alerts enabled</p>
          <div style={buttonContainerStyle}>
            <motion.button onClick={handleLogout} style={buttonStyle("#f44336")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>🚪 Exit System</motion.button>
            <motion.button onClick={() => navigate("/emergency-contacts")} style={buttonStyle("#FF9500")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>📞 Emergency Contacts</motion.button>
          </div>
        </motion.div>

        <motion.div style={cardStyle} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <h3 style={{ color: "#FF4538", marginBottom: "20px", textAlign: "center" }}>📍 Manual Location Check</h3>
          <ManualTriggerForm
            manualLat={manualLat}
            setManualLat={setManualLat}
            manualLng={manualLng}
            setManualLng={setManualLng}
            onSubmit={handleManualCheck}
            submitting={submitting}
          />
        </motion.div>

        <motion.div style={cardStyle} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.35 }}>
          <h3 style={{ color: "#FF4538", marginBottom: "12px", textAlign: "center" }}>🌋 EONET Live Events Filter</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <select value={eonetCategory} onChange={(e) => setEonetCategory(e.target.value)} style={{ padding: 8, borderRadius: 8 }} title="Category">
              <option value="earthquakes">Earthquakes</option>
              <option value="wildfires">Wildfires</option>
              <option value="severeStorms">Severe Storms</option>
              <option value="volcanoes">Volcanoes</option>
              <option value="floods">Floods</option>
              <option value="icebergs">Icebergs</option>
              <option value="">All Open Events</option>
            </select>
            <select value={eonetStatus} onChange={(e) => setEonetStatus(e.target.value)} style={{ padding: 8, borderRadius: 8 }} title="Status">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
            <input type="number" min={1} max={365} value={eonetDays} onChange={(e) => setEonetDays(Number(e.target.value))} style={{ padding: 8, borderRadius: 8, width: 120 }} placeholder="Days" title="Lookback days" />
            <input type="number" min={1} max={1000} value={eonetLimit} onChange={(e) => setEonetLimit(Number(e.target.value))} style={{ padding: 8, borderRadius: 8, width: 120 }} placeholder="Limit" title="Event limit" />
            <input type="number" min={30} max={3600} value={autoRefreshSec} onChange={(e) => setAutoRefreshSec(Math.min(3600, Math.max(30, Number(e.target.value))))} style={{ padding: 8, borderRadius: 8, width: 160 }} placeholder="Refresh (sec)" title="Auto-refresh seconds" />
          </div>
        </motion.div>

        {coords && (
          <motion.div style={cardStyle} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h3 style={{ color: "#FF4538", marginBottom: "20px", textAlign: "center" }}>🗺️ Your Location</h3>
            <MapView
              latitude={coords.latitude}
              longitude={coords.longitude}
              title="Monitoring Location"
              subtitle={`Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`}
              eonetCategory={eonetCategory}
              eonetStatus={eonetStatus}
              eonetDays={eonetDays}
              eonetLimit={eonetLimit}
              autoRefreshSec={autoRefreshSec}
            />
          </motion.div>
        )}

        {coords && (
          <motion.div style={cardStyle} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            <DisasterDashboard coords={coords} dailyWeather={weather} onAlert={handleDashboardAlert} />
          </motion.div>
        )}

        <AnimatePresence>
          {loading && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", color: "#FF9500", fontSize: "1.2rem", fontWeight: "bold" }}>🛰️ Fetching NASA satellite data...</motion.p>}
        </AnimatePresence>

        {locationError && <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ textAlign: "center", color: "#FF4538", fontSize: "1.1rem", fontWeight: "bold" }}>❌ {locationError}</motion.p>}

        {weather.length > 0 && (
          <motion.div style={cardStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <h2 style={{ color: "#FF4538", marginBottom: "15px", textAlign: "center", fontSize: "1.8rem" }}>📊 NASA POWER API - Weather Data</h2>
            {latestAvailable?.date && <p style={{ textAlign: "center", color: "#FF9500", marginBottom: "25px", fontSize: "1rem" }}>📅 Latest: {latestAvailable.date}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" }}>
              {weather.map((day, index) => (
                <motion.div key={day.date} style={weatherCardStyle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }} whileHover={{ scale: 1.05, boxShadow: "0 6px 30px rgba(255, 69, 58, 0.5)" }}>
                  <div style={{ fontSize: "1.1rem", marginBottom: "15px", borderBottom: "2px solid rgba(255,149,0,0.3)", paddingBottom: "10px" }}>📅 <strong>{day.date}</strong></div>
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
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "1.1rem" }}>
            No weather data available for the last 5 days.
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default Home;
