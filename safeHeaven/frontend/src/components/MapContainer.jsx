// src/components/MapContainer.jsx

import React from "react";
import { space, radius, shadow, color } from "../styles/uiTokens";

const MapContainer = ({
  title = "Location Map",
  subtitle = "",
  footerItems = ["Map data © Mapbox/OSM"],
  maxWidth = 1100,
  style = {},
  children
}) => {
  return (
    <div
      style={{
        maxWidth,
        margin: "0 auto", // external spacing controlled by parent section [web:319]
        padding: 0,
        borderRadius: radius.lg,
        overflow: "hidden",
        boxShadow: shadow.md,
        border: `1px solid ${color.border}`,
        background: `linear-gradient(180deg, ${color.gradTop} 0%, ${color.gradBottom} 100%)`,
        ...style
      }}
    >
      <div
        style={{
          padding: `${space.md}px ${space.lg}px`,
          borderBottom: `1px solid ${color.border}`,
          background: "linear-gradient(180deg,#F7F9FC 0%,#F2F4F7 100%)"
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: color.text }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 13, color: color.subtext, marginTop: 4 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      <div style={{ position: "relative", background: color.panel }}>{children}</div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          gap: space.sm,
          alignItems: "center",
          padding: `${space.sm}px ${space.md}px`,
          borderTop: `1px solid ${color.border}`,
          background: color.panel
        }}
      >
        {footerItems.map((text, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              color: color.subtext,
              background: "#F3F4F6",
              padding: "4px 8px",
              borderRadius: radius.sm
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MapContainer;
