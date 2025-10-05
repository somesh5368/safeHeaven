// src/components/ManualTriggerForm.js
import React, { useMemo } from "react";
import { motion } from "framer-motion";

const ManualTriggerForm = ({
  manualLat,
  setManualLat,
  manualLng,
  setManualLng,
  onSubmit,
  submitting,
}) => {
  const containerStyle = {
    background: "rgba(15, 20, 40, 0.8)",
    backdropFilter: "blur(15px)",
    borderRadius: "18px",
    padding: "30px",
    border: "2px solid rgba(255, 149, 0, 0.3)",
    boxShadow: "0 8px 32px rgba(255, 69, 58, 0.2)",
  };

  const titleStyle = {
    color: "#FF4538",
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "10px",
    textShadow: "0 0 15px rgba(255, 69, 58, 0.5)",
  };

  const subtitleStyle = {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.9rem",
    textAlign: "center",
    marginBottom: "25px",
  };

  const formContainerStyle = {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  };

  const inputStyle = {
    padding: "14px 18px",
    width: "160px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "2px solid rgba(255, 149, 0, 0.3)",
    borderRadius: "12px",
    color: "white",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    padding: "14px 28px",
    background: submitting
      ? "linear-gradient(45deg, #666, #888)"
      : "linear-gradient(45deg, #FF4538, #FF6B35)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: submitting ? "not-allowed" : "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    boxShadow: submitting
      ? "0 4px 15px rgba(100, 100, 100, 0.3)"
      : "0 4px 15px rgba(255, 69, 58, 0.4)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const infoBoxStyle = {
    marginTop: "20px",
    padding: "15px",
    background: "rgba(255, 149, 0, 0.1)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 149, 0, 0.3)",
    textAlign: "center",
  };

  const infoTextStyle = {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "0.85rem",
    margin: 0,
    lineHeight: "1.6",
  };

  const commitIfEnter = (e) => {
    if (e.key === "Enter" && !submitting) {
      onSubmit();
    }
  };

  const latNum = useMemo(() => Number(manualLat), [manualLat]);
  const lngNum = useMemo(() => Number(manualLng), [manualLng]);
  const latValid = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90;
  const lngValid = Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180;
  const canSubmit = latValid && lngValid && !submitting;

  const presets = [
    { label: "🌀 Storms (Bahamas)", lat: 24.2, lng: -77.3 },
    { label: "🌊 Floods (Jakarta)", lat: -6.2, lng: 106.8 },
    { label: "🏚️ Quakes (Japan)", lat: 36.0, lng: 142.0 },
  ];

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: "10px" }}>
          📍
        </div>
        <h3 style={titleStyle}>Manual Coordinates Check</h3>
        <p style={subtitleStyle}>
          Enter any location worldwide for disaster assessment
        </p>
      </motion.div>

      <motion.div
        style={formContainerStyle}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.input
          type="text"
          placeholder="🌐 Latitude (e.g., 19.0760)"
          value={manualLat}
          onChange={(e) => setManualLat(e.target.value)}
          onKeyDown={commitIfEnter}
          style={inputStyle}
          autoComplete="off"
          inputMode="decimal"
          whileFocus={{
            borderColor: "#FF4538",
            boxShadow: "0 0 20px rgba(255, 69, 58, 0.5)",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#FF4538";
            e.target.style.boxShadow = "0 0 20px rgba(255, 69, 58, 0.5)";
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255, 149, 0, 0.3)";
            e.target.style.boxShadow = "none";
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
          }}
        />

        <motion.input
          type="text"
          placeholder="🗺️ Longitude (e.g., 72.8777)"
          value={manualLng}
          onChange={(e) => setManualLng(e.target.value)}
          onKeyDown={commitIfEnter}
          style={inputStyle}
          autoComplete="off"
          inputMode="decimal"
          whileFocus={{
            borderColor: "#FF4538",
            boxShadow: "0 0 20px rgba(255, 69, 58, 0.5)",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#FF4538";
            e.target.style.boxShadow = "0 0 20px rgba(255, 69, 58, 0.5)";
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255, 149, 0, 0.3)";
            e.target.style.boxShadow = "none";
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
          }}
        />

        <motion.button
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{
            ...buttonStyle,
            opacity: canSubmit ? 1 : 0.6,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
          whileHover={
            canSubmit
              ? { scale: 1.05, boxShadow: "0 6px 25px rgba(255, 69, 58, 0.6)" }
              : {}
          }
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          title={!canSubmit ? "Enter valid latitude and longitude" : "Run hazard check"}
        >
          {submitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-block" }}
              >
                🛰️
              </motion.span>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>🚨</span>
              <span>Check Hazards</span>
            </>
          )}
        </motion.button>
      </motion.div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setManualLat(String(p.lat));
              setManualLng(String(p.lng));
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,149,0,0.35)",
              background: "rgba(255,149,0,0.1)",
              color: "white",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
            title="Quick-fill test coordinates"
          >
            {p.label}
          </button>
        ))}
      </div>

      <motion.div
        style={infoBoxStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p style={infoTextStyle}>
          <strong>📌 Pro Tip:</strong> Use presets above to instantly jump near active events for quick testing
        </p>
        <p style={{ ...infoTextStyle, marginTop: "10px" }}>
          🛰️ <strong>Data from NASA EONET</strong> • Real-time natural hazard tracker
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ManualTriggerForm;
