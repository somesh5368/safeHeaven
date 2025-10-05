// src/components/DisasterCard.jsx
import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

const STATUS_STYLES = {
  neutral: { bg: "rgba(76, 175, 80, 0.15)", border: "#4CAF50", text: "#4CAF50", chipBg: "rgba(76, 175, 80, 0.2)", glow: "rgba(76, 175, 80, 0.4)", icon: "✅" },
  warning: { bg: "rgba(255, 152, 0, 0.15)", border: "#FF9500", text: "#FF9500", chipBg: "rgba(255, 152, 0, 0.2)", glow: "rgba(255, 152, 0, 0.5)", icon: "⚠️" },
  critical:{ bg: "rgba(244, 67, 54, 0.15)", border: "#FF4538", text: "#FF4538", chipBg: "rgba(244, 67, 54, 0.2)", glow: "rgba(244, 67, 54, 0.5)", icon: "🚨" },
};

const ICONS = { earthquake: "🏚️", flood: "🌊", cyclone: "🌪️", tsunami: "🌊" };

const displayValue = (v) => (v == null || v === "" ? "Data unavailable" : v);

const DisasterCard = ({ type, title, coords, data, status = "neutral", onViewDetails, onDispatchEmergency }) => {
  const styl = STATUS_STYLES[status] || STATUS_STYLES.neutral;
  const isAlerting = status === "warning" || status === "critical";
  const motionKey = useMemo(() => `${type}-${status}-${title}`, [type, status, title]);

  const [showFlash, setShowFlash] = useState(false);
  useEffect(() => {
    if (isAlerting) {
      setShowFlash(true);
      const t = setTimeout(() => setShowFlash(false), 4000);
      return () => clearTimeout(t);
    }
    setShowFlash(false);
  }, [isAlerting, status]);

  const cardStyle = {
    background: "rgba(15, 20, 40, 0.85)", backdropFilter: "blur(15px)", border: `3px solid ${styl.border}`, color: "white",
    borderRadius: "18px", padding: "25px", minWidth: "320px", maxWidth: "400px", boxShadow: `0 8px 32px ${styl.glow}`,
    position: "relative", overflow: "hidden",
  };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" };
  const titleStyle = { fontWeight: "bold", fontSize: "1.3rem", color: styl.text, textShadow: `0 0 15px ${styl.glow}`, display: "flex", alignItems: "center", gap: "10px" };
  const statusBadgeStyle = { fontSize: "0.75rem", padding: "6px 14px", borderRadius: "20px", background: styl.chipBg, border: `2px solid ${styl.border}`, color: styl.text, fontWeight: "bold", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", boxShadow: `0 4px 15px ${styl.glow}` };
  const coordsStyle = { fontSize: "0.85rem", marginTop: "10px", color: "rgba(255, 255, 255, 0.7)", padding: "8px 12px", background: "rgba(255, 149, 0, 0.1)", borderRadius: "8px", border: "1px solid rgba(255, 149, 0, 0.3)", display: "inline-block" };
  const dataBoxStyle = { marginTop: "15px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "15px", border: `2px dashed ${styl.border}` };
  const dataLineStyle = { fontSize: "0.9rem", margin: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(255, 255, 255, 0.9)", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" };
  const noteStyle = { fontSize: "0.8rem", marginTop: "12px", color: "rgba(255, 255, 255, 0.6)", fontStyle: "italic", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" };
  const footerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", paddingTop: "15px", borderTop: `1px solid ${styl.border}` };
  const updateTimeStyle = { fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)" };
  const buttonStyle = { fontSize: "0.9rem", padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer", background: `linear-gradient(45deg, ${styl.border}, ${styl.text})`, color: "white", fontWeight: "bold", boxShadow: `0 4px 15px ${styl.glow}`, transition: "all 0.3s ease" };

  const pulseAnimation = status !== "neutral" ? { scale: [1, 1.02, 1], boxShadow: [`0 8px 32px ${styl.glow}`, `0 12px 40px ${styl.glow}`, `0 8px 32px ${styl.glow}`] } : {};

  const flashStrip = showFlash && isAlerting ? (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      style={{
        margin: "-10px 0 10px 0", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${styl.border}`,
        background: status === "critical" ? "rgba(244, 67, 54, 0.25)" : "rgba(255, 152, 0, 0.25)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}
    >
      <span style={{ color: styl.text, fontWeight: 800 }}>
        {status === "critical" ? "Emergency" : "Moderate"} alert — monitoring in progress
      </span>
      <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>⏳</span>
    </motion.div>
  ) : null;

  const confirmStrip = isAlerting ? (
    <div
      style={{
        margin: "-10px 0 10px 0", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${styl.border}`,
        background: status === "critical" ? "rgba(244, 67, 54, 0.15)" : "rgba(255, 152, 0, 0.15)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}
    >
      <span style={{ color: styl.text, fontWeight: 700 }}>
        {status === "critical" ? "Emergency" : "Moderate"} alert detected — send to contacts (coming soon)
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          disabled title="Sending to contacts will be enabled soon"
          style={{
            ...buttonStyle, padding: "8px 12px",
            background: status === "critical" ? "linear-gradient(45deg, #AA2E25, #C62828)" : "linear-gradient(45deg, #B26A00, #EF6C00)",
            opacity: 0.6, cursor: "not-allowed",
          }}
        >
          Send Alert
        </button>
        <button
          onClick={onViewDetails}
          style={{ ...buttonStyle, padding: "8px 12px", background: "linear-gradient(45deg, #444, #666)" }}
        >
          Review
        </button>
      </div>
    </div>
  ) : null;

  return (
    <motion.div
      key={motionKey}
      style={cardStyle}
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, ...pulseAnimation }}
      transition={{ duration: 0.6, ...(status !== "neutral" && { repeat: Infinity, duration: 2 }) }}
      whileHover={{ scale: 1.03, y: -8, boxShadow: `0 12px 40px ${styl.glow}` }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: `radial-gradient(circle at 20% 50%, ${styl.border} 1px, transparent 1px)`, backgroundSize: "20px 20px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={headerStyle}>
          <motion.div style={titleStyle} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.span
              animate={status !== "neutral" ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 1, repeat: status !== "neutral" ? Infinity : 0, repeatDelay: 1 }}
              style={{ fontSize: "1.8rem" }}
            >
              {ICONS[type]}
            </motion.span>
            <span>{title}</span>
          </motion.div>

          <motion.div style={statusBadgeStyle} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <span>{styl.icon}</span>
            <span>{status.toUpperCase()}</span>
          </motion.div>
        </div>

        {flashStrip}
        {confirmStrip}

        <motion.div style={coordsStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          📍 Lat {coords?.latitude?.toFixed?.(4) || "N/A"}, Lng {coords?.longitude?.toFixed?.(4) || "N/A"}
        </motion.div>

        <motion.div style={dataBoxStyle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          {data?.lines?.length ? (
            data.lines.map((l, i) => (
              <motion.div key={i} style={dataLineStyle} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}>
                <span style={{ opacity: 0.8 }}>{l.label}:</span>
                <span style={{ fontWeight: "bold", color: styl.text, fontSize: "1rem" }}>
                  {displayValue(l.value)}
                </span>
              </motion.div>
            ))
          ) : (
            <div style={{ fontSize: "0.9rem", opacity: 0.7, textAlign: "center", padding: "10px" }}>📊 No data available</div>
          )}
        </motion.div>

        {data?.note && (
          <motion.div style={noteStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}>
            🛰️ <strong>Note:</strong> {data.note}
          </motion.div>
        )}

        <motion.div style={footerStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.9 }}>
          <div style={updateTimeStyle}>🕐 Updated: {data?.updatedAt || "Not available"}</div>
          <motion.button onClick={onViewDetails} style={buttonStyle} whileHover={{ scale: 1.05, boxShadow: `0 6px 25px ${styl.glow}` }} whileTap={{ scale: 0.95 }}>
            View Details →
          </motion.button>
        </motion.div>
      </div>

      {isAlerting && (
        <motion.div
          initial={{ opacity: 0.2, scale: 0.98 }}
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ position: "absolute", inset: 0, borderRadius: "18px", boxShadow: `0 0 0 3px ${styl.border} inset`, pointerEvents: "none" }}
        />
      )}
    </motion.div>
  );
};

export default DisasterCard;
