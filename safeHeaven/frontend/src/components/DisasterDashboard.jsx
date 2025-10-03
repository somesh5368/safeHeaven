// src/components/DisasterDashboard.jsx
import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import DisasterCard from "./DisasterCard";
import AutoHazardEvaluator from "./AutoHazardEvaluator";

export default function DisasterDashboard({ coords, onAlert }) {
  const [model, setModel] = useState({
    loading: false,
    flood: { status: "neutral", lines: [], updatedAt: "", note: "" },
    cyclone: { status: "neutral", lines: [], updatedAt: "", note: "" },
    earthquake: { status: "neutral", lines: [], updatedAt: "", note: "" },
    tsunami: { status: "neutral", lines: [], updatedAt: "", note: "" }
  });

  const handleResult = useCallback((m) => {
    setModel({
      loading: m.loading,
      flood: m.flood,
      cyclone: m.cyclone,
      earthquake: m.earthquake,
      tsunami: m.tsunami
    });

    // Trigger alert if needed
    if (m.top?.level === 'critical' || m.top?.level === 'warning') {
      onAlert?.(m.top.key, m.top.level);
    }
  }, [onAlert]);

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

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "25px",
    marginTop: "25px",
  };

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

      {/* Data fetcher - NO UI */}
      <AutoHazardEvaluator 
        coords={coords} 
        onResult={handleResult} 
        showUI={false}  
      />

      {/* Display loading state */}
      {model.loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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

      {/* Cards Grid */}
      <div style={gridStyle}>
        <DisasterCard 
          type="flood" 
          title="Flood Risk" 
          coords={coords} 
          data={model.flood} 
          status={model.flood.status} 
          onViewDetails={() => console.log('View flood details')} 
        />
        <DisasterCard 
          type="cyclone" 
          title="Cyclone Risk" 
          coords={coords} 
          data={model.cyclone} 
          status={model.cyclone.status} 
          onViewDetails={() => console.log('View cyclone details')} 
        />
        <DisasterCard 
          type="earthquake" 
          title="Earthquake Activity" 
          coords={coords} 
          data={model.earthquake} 
          status={model.earthquake.status} 
          onViewDetails={() => console.log('View earthquake details')} 
        />
        <DisasterCard 
          type="tsunami" 
          title="Tsunami Alerts" 
          coords={coords} 
          data={model.tsunami} 
          status={model.tsunami.status} 
          onViewDetails={() => console.log('View tsunami details')} 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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
