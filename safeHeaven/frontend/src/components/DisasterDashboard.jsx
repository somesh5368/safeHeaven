// src/components/DisasterDashboard.jsx
import React, { useState, useCallback } from "react";
import DisasterCard from "./DisasterCard";
import AutoHazardEvaluator from "./AutoHazardEvaluator";

export default function DisasterDashboard({ coords }) {
  const [model, setModel] = useState({
    loading: false,
    flood: { status: "neutral", lines: [], updatedAt: "" },
    cyclone: { status: "neutral", lines: [], updatedAt: "" },
    earthquake: { status: "neutral", lines: [], updatedAt: "" },
    tsunami: { status: "neutral", lines: [], updatedAt: "" }
  });

  const handleResult = useCallback((m) => {
    setModel({
      loading: m.loading,
      flood: m.flood,
      cyclone: m.cyclone,
      earthquake: m.earthquake,
      tsunami: m.tsunami
    });
  }, []);

  const gridStyle = {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(2, minmax(300px, 1fr))",
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 14px" }}>
      <h2 style={{ textAlign: "left", margin: "20px 0 14px", fontSize: 20, fontWeight: 800 }}>
        Hazard Dashboard
      </h2>

      <AutoHazardEvaluator coords={coords} onResult={handleResult} />

      <div
        style={{
          ...gridStyle,
          ...(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 680px)").matches
            ? { gridTemplateColumns: "repeat(1, 1fr)" }
            : null),
        }}
      >
        <DisasterCard type="earthquake" title="Earthquake" coords={coords} data={model.earthquake} status={model.earthquake.status} onViewDetails={() => {}} />
        <DisasterCard type="flood" title="Flood" coords={coords} data={model.flood} status={model.flood.status} onViewDetails={() => {}} />
        <DisasterCard type="cyclone" title="Cyclone/Storm" coords={coords} data={model.cyclone} status={model.cyclone.status} onViewDetails={() => {}} />
        <DisasterCard type="tsunami" title="Tsunami" coords={coords} data={model.tsunami} status={model.tsunami.status} onViewDetails={() => {}} />
      </div>
    </div>
  );
}
