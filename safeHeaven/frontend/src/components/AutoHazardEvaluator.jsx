// src/components/AutoHazardEvaluator.jsx

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWeather } from "../utils/fetchWeather";
import { fetchEarthquakes } from "../utils/fetchEarthquakes";
import { fetchTsunamiAlerts } from "../utils/fetchTsunamiAlerts";

const valOr0 = (v) => (v == null ? 0 : Number(v));

const deriveFloodStatus = (recent = []) => {
  const last = recent.slice(-1)[0];
  const r = valOr0(last?.rain);
  if (r >= 80) return "critical";
  if (r >= 30) return "warning";
  return "neutral";
};

const deriveCycloneStatus = (recent = []) => {
  const last = recent.slice(-1)[0];
  const r = valOr0(last?.rain);
  if (r >= 60) return "warning";
  return "neutral";
};

const fmtVal = (v, unit, digits = 1) => {
  if (v == null) return "Data unavailable";
  const n = Number(v);
  if (!Number.isFinite(n)) return "Data unavailable";
  if (unit === "%") return `${n.toFixed(0)} %`;
  if (unit === "mm") return `${n.toFixed(1)} mm`;
  return `${n.toFixed(digits)} °C`;
};

export default function AutoHazardEvaluator({ coords, onResult, showUI = true }) {
  const [daily, setDaily] = useState([]);
  const [quakes, setQuakes] = useState([]);
  const [tsu, setTsu] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);

  const [wxErr, setWxErr] = useState("");
  const [eqErr, setEqErr] = useState("");
  const [tsuErr, setTsuErr] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!coords?.latitude || !coords?.longitude) return;
      setLoading(true);
      setWxErr("");
      setEqErr("");
      setTsuErr("");
      try {
        const [wx, eq, ta] = await Promise.all([
          fetchWeather(coords.latitude, coords.longitude).catch((e) => {
            setWxErr(e?.message || "Weather error");
            return [];
          }),
          fetchEarthquakes({
            lat: coords.latitude,
            lon: coords.longitude,
            hours: 48,
            radiusKm: 500,
            minmag: 3.0,
          }).catch((e) => {
            setEqErr(e?.message || "USGS error");
            return [];
          }),
          fetchTsunamiAlerts().catch((e) => {
            setTsuErr(e?.message || "NWS error");
            return [];
          }),
        ]);
        if (!alive) return;
        setDaily(wx || []);
        setQuakes(eq || []);
        setTsu(ta || []);
        setUpdatedAt(new Date().toLocaleString());
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [coords?.latitude, coords?.longitude]);

  const recent = useMemo(
    () =>
      daily.map((d) => ({
        date: d.date,
        temp: d.temperature == null ? null : Number(d.temperature),
        humidity: d.humidity == null ? null : Number(d.humidity),
        rain: d.rain == null ? null : Number(d.rain),
      })),
    [daily]
  );

  const recentValid = useMemo(() => {
    for (let i = recent.length - 1; i >= 0; i--) {
      const r = recent[i];
      if (r && (r.rain != null || r.humidity != null || r.temp != null))
        return r;
    }
    return recent[recent.length - 1] || null;
  }, [recent]);

  const flood = useMemo(() => {
    const st = deriveFloodStatus(recent);
    const lines = [
      { label: "Rain (latest avail.)", value: fmtVal(recentValid?.rain, "mm") },
      { label: "Humidity (latest avail.)", value: fmtVal(recentValid?.humidity, "%") },
      { label: "Temp (latest avail.)", value: fmtVal(recentValid?.temp, "°C") },
      { label: "Data date", value: recentValid?.date || "Data unavailable" },
    ];
    if (wxErr) lines.unshift({ label: "POWER status", value: wxErr });
    return {
      status: st,
      lines,
      note: "Latest available day within last 5 days (NASA POWER)",
      updatedAt,
    };
  }, [recent, recentValid, updatedAt, wxErr]);

  const cyclone = useMemo(() => {
    const st = deriveCycloneStatus(recent);
    const lines = [
      { label: "Rain (latest avail.)", value: fmtVal(recentValid?.rain, "mm") },
      { label: "Humidity (latest avail.)", value: fmtVal(recentValid?.humidity, "%") },
      { label: "Temp (latest avail.)", value: fmtVal(recentValid?.temp, "°C") },
      { label: "Data date", value: recentValid?.date || "Data unavailable" },
    ];
    if (wxErr) lines.unshift({ label: "POWER status", value: wxErr });
    return {
      status: st,
      lines,
      note: "Latest available day within last 5 days (NASA POWER)",
      updatedAt,
    };
  }, [recent, recentValid, updatedAt, wxErr]);

  const eqStatus = useMemo(() => {
    const anyStrong = quakes.some((q) => (q.mag ?? 0) >= 5.0);
    const cluster = quakes.filter((q) => (q.mag ?? 0) >= 4.0).length >= 3;
    return anyStrong || cluster ? "warning" : "neutral";
  }, [quakes]);

  const earthquake = useMemo(() => {
    const lines = [
      { label: "Recent quakes (48h)", value: quakes.length || 0 },
      {
        label: "Strongest mag",
        value: quakes.length
          ? Math.max(...quakes.map((q) => q.mag || 0)).toFixed(1)
          : "None",
      },
    ];
    if (eqErr) lines.unshift({ label: "USGS status", value: eqErr });
    return {
      status: eqStatus,
      lines,
      note: "USGS 48h within 500 km",
      updatedAt,
    };
  }, [eqStatus, quakes, updatedAt, eqErr]);

  const tsunami = useMemo(() => {
    const lines = [
      { label: "Active advisories", value: tsu.length || 0 },
      { label: "Most recent", value: tsu[0]?.headline || "None" },
    ];
    if (tsuErr) lines.unshift({ label: "NWS status", value: tsuErr });
    return {
      status: tsu.length > 0 ? "warning" : "neutral",
      lines,
      note: "NWS tsunami alerts",
      updatedAt,
    };
  }, [tsu, updatedAt, tsuErr]);

  useEffect(() => {
    const order = { critical: 2, warning: 1, neutral: 0 };
    const list = [
      { key: "flood", level: flood.status },
      { key: "cyclone", level: cyclone.status },
      { key: "earthquake", level: earthquake.status },
      { key: "tsunami", level: tsunami.status },
    ];
    const top = list.sort((a, b) => order[b.level] - order[a.level])[0];
    onResult?.({
      loading,
      daily,
      quakes,
      tsu,
      flood,
      cyclone,
      earthquake,
      tsunami,
      top,
    });
  }, [loading, daily, quakes, tsu, flood, cyclone, earthquake, tsunami, onResult]);

  // Styles
  const containerStyle = {
    background: "rgba(15, 20, 40, 0.85)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "35px",
    border: "2px solid rgba(255, 69, 58, 0.3)",
    boxShadow: "0 8px 40px rgba(255, 69, 58, 0.2)",
    marginBottom: "30px",
  };

  const titleStyle = {
    color: "#FF4538",
    fontSize: "2rem",
    marginBottom: "10px",
    textAlign: "center",
    fontWeight: "bold",
    textShadow: "0 0 20px rgba(255, 69, 58, 0.6)",
  };

  const subtitleStyle = {
    color: "#FF9500",
    fontSize: "1rem",
    marginBottom: "30px",
    textAlign: "center",
    opacity: 0.9,
  };

  const hazardGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "25px",
    marginTop: "25px",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return { 
          bg: "rgba(244, 67, 54, 0.15)", 
          border: "#f44336", 
          glow: "rgba(244, 67, 54, 0.5)",
          icon: "🚨"
        };
      case "warning":
        return { 
          bg: "rgba(255, 152, 0, 0.15)", 
          border: "#ff9800", 
          glow: "rgba(255, 152, 0, 0.5)",
          icon: "⚠️"
        };
      default:
        return { 
          bg: "rgba(76, 175, 80, 0.15)", 
          border: "#4CAF50", 
          glow: "rgba(76, 175, 80, 0.5)",
          icon: "✅"
        };
    }
  };

  const getHazardIcon = (type, status) => {
    const icons = {
      flood: { critical: "🌊", warning: "💧", neutral: "☁️" },
      cyclone: { critical: "🌪️", warning: "🌀", neutral: "🌬️" },
      earthquake: { critical: "🔴", warning: "⚠️", neutral: "🟢" },
      tsunami: { critical: "🌊", warning: "⚠️", neutral: "✅" },
    };
    return icons[type]?.[status] || "📊";
  };

  const hazardCardStyle = (status) => {
    const colors = getStatusColor(status);
    return {
      background: colors.bg,
      border: `3px solid ${colors.border}`,
      borderRadius: "18px",
      padding: "25px",
      color: "white",
      transition: "all 0.4s ease",
      boxShadow: `0 6px 25px ${colors.glow}`,
      position: "relative",
      overflow: "hidden",
    };
  };

  const statusBadgeStyle = (status) => {
    const colors = getStatusColor(status);
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 18px",
      borderRadius: "25px",
      background: colors.border,
      color: "white",
      fontSize: "0.9rem",
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: "20px",
      boxShadow: `0 4px 15px ${colors.glow}`,
    };
  };

  const dataLineStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    fontSize: "0.95rem",
  };

  const noteStyle = {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: "18px",
    fontStyle: "italic",
    paddingTop: "15px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 6px 25px rgba(255, 69, 58, 0.3)",
      "0 8px 35px rgba(255, 69, 58, 0.6)",
      "0 6px 25px rgba(255, 69, 58, 0.3)",
    ],
  };

  if (!showUI) return null;

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ textAlign: "center", fontSize: "4rem", marginBottom: "15px" }}
      >
        🛰️
      </motion.div>

      <h2 style={titleStyle}>NASA Hazard Assessment</h2>
      <p style={subtitleStyle}>Real-Time Multi-Source Disaster Analysis</p>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              textAlign: "center",
              color: "#FF9500",
              fontSize: "1.2rem",
              marginBottom: "25px",
              fontWeight: "600",
            }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block", marginRight: "10px" }}
            >
              🛰️
            </motion.span>
            Analyzing satellite data from NASA, USGS & NWS...
          </motion.div>
        )}
      </AnimatePresence>

      {updatedAt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "0.9rem",
            marginBottom: "25px",
            padding: "10px",
            background: "rgba(255, 149, 0, 0.1)",
            borderRadius: "10px",
            border: "1px solid rgba(255, 149, 0, 0.3)",
          }}
        >
          🕐 Last updated: {updatedAt}
        </motion.div>
      )}

      <div style={hazardGridStyle}>
        {/* Flood Card */}
        <motion.div
          style={hazardCardStyle(flood.status)}
          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: `0 8px 35px ${getStatusColor(flood.status).glow}`,
            y: -5 
          }}
        >
          <motion.div 
            style={{ fontSize: "3rem", marginBottom: "15px", textAlign: "center" }}
            animate={flood.status !== "neutral" ? pulseAnimation : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getHazardIcon("flood", flood.status)}
          </motion.div>
          
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.5rem", textAlign: "center" }}>
            Flood Risk
          </h3>
          
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={statusBadgeStyle(flood.status)}>
              {getStatusColor(flood.status).icon}
              <span>{flood.status}</span>
            </div>
          </div>
          
          {flood.lines.map((line, idx) => (
            <motion.div 
              key={idx} 
              style={dataLineStyle}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <span style={{ opacity: 0.8 }}>{line.label}:</span>
              <strong style={{ color: "#FF9500" }}>{line.value}</strong>
            </motion.div>
          ))}
          
          <p style={noteStyle}>🛰️ {flood.note}</p>
        </motion.div>

        {/* Cyclone Card */}
        <motion.div
          style={hazardCardStyle(cyclone.status)}
          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: `0 8px 35px ${getStatusColor(cyclone.status).glow}`,
            y: -5 
          }}
        >
          <motion.div 
            style={{ fontSize: "3rem", marginBottom: "15px", textAlign: "center" }}
            animate={cyclone.status !== "neutral" ? { rotate: 360 } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            {getHazardIcon("cyclone", cyclone.status)}
          </motion.div>
          
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.5rem", textAlign: "center" }}>
            Cyclone Risk
          </h3>
          
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={statusBadgeStyle(cyclone.status)}>
              {getStatusColor(cyclone.status).icon}
              <span>{cyclone.status}</span>
            </div>
          </div>
          
          {cyclone.lines.map((line, idx) => (
            <motion.div 
              key={idx} 
              style={dataLineStyle}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
            >
              <span style={{ opacity: 0.8 }}>{line.label}:</span>
              <strong style={{ color: "#FF9500" }}>{line.value}</strong>
            </motion.div>
          ))}
          
          <p style={noteStyle}>🛰️ {cyclone.note}</p>
        </motion.div>

        {/* Earthquake Card */}
        <motion.div
          style={hazardCardStyle(earthquake.status)}
          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: `0 8px 35px ${getStatusColor(earthquake.status).glow}`,
            y: -5 
          }}
        >
          <motion.div 
            style={{ fontSize: "3rem", marginBottom: "15px", textAlign: "center" }}
            animate={earthquake.status !== "neutral" ? { 
              x: [-3, 3, -3, 3, 0],
              y: [-3, 3, -3, 3, 0]
            } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            {getHazardIcon("earthquake", earthquake.status)}
          </motion.div>
          
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.5rem", textAlign: "center" }}>
            Earthquake Activity
          </h3>
          
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={statusBadgeStyle(earthquake.status)}>
              {getStatusColor(earthquake.status).icon}
              <span>{earthquake.status}</span>
            </div>
          </div>
          
          {earthquake.lines.map((line, idx) => (
            <motion.div 
              key={idx} 
              style={dataLineStyle}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              <span style={{ opacity: 0.8 }}>{line.label}:</span>
              <strong style={{ color: "#FF9500" }}>{line.value}</strong>
            </motion.div>
          ))}
          
          <p style={noteStyle}>🌍 {earthquake.note}</p>
        </motion.div>

        {/* Tsunami Card */}
        <motion.div
          style={hazardCardStyle(tsunami.status)}
          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: `0 8px 35px ${getStatusColor(tsunami.status).glow}`,
            y: -5 
          }}
        >
          <motion.div 
            style={{ fontSize: "3rem", marginBottom: "15px", textAlign: "center" }}
            animate={tsunami.status !== "neutral" ? pulseAnimation : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getHazardIcon("tsunami", tsunami.status)}
          </motion.div>
          
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.5rem", textAlign: "center" }}>
            Tsunami Alerts
          </h3>
          
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={statusBadgeStyle(tsunami.status)}>
              {getStatusColor(tsunami.status).icon}
              <span>{tsunami.status}</span>
            </div>
          </div>
          
          {tsunami.lines.map((line, idx) => (
            <motion.div 
              key={idx} 
              style={dataLineStyle}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
            >
              <span style={{ opacity: 0.8 }}>{line.label}:</span>
              <strong style={{ color: "#FF9500" }}>{line.value}</strong>
            </motion.div>
          ))}
          
          <p style={noteStyle}>🌊 {tsunami.note}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "rgba(255, 149, 0, 0.1)",
          borderRadius: "15px",
          border: "2px solid rgba(255, 149, 0, 0.3)",
          textAlign: "center",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", margin: 0 }}>
          🛰️ <strong>Data Sources:</strong> NASA POWER API • USGS Earthquake Data • NOAA/NWS Tsunami Alerts
        </p>
      </motion.div>
    </motion.div>
  );
}
