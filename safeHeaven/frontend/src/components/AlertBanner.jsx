// src/components/AlertBanner.jsx
import React from "react";
const AlertBanner = ({ banner, onClose }) => {
  if (!banner) return null;

  return (
    <>
      <style>{`
        @keyframes pulse { 0% {opacity:1;} 50% {opacity:.85;} 100% {opacity:1;} }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          backgroundColor: banner.color,
          color: 'white',
          padding: '14px 16px',
          textAlign: 'center',
          fontWeight: 700,
          boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
          animation: 'pulse 1s infinite'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>
            {banner.icon} {banner.title} {banner.icon}
          </div>
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            Location: {banner.coordinates} | Time: {banner.timestamp}
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>{banner.message}</div>
          <div
            style={{
              display: 'inline-block',
              fontSize: 16,
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: 4
            }}
          >
            ⚠️ {banner.actionText} ⚠️
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 12,
              top: 10,
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 3,
              cursor: 'pointer'
            }}
            aria-label="Close alert"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
};

export default AlertBanner;
