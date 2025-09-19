// src/components/ManualTriggerForm.jsx
import React from "react";

const ManualTriggerForm = ({
  manualLat, setManualLat,
  manualLng, setManualLng,
  disaster, setDisaster,
  onSubmit, submitting
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        margin: "12px 0 24px",
      }}
    >
      <input
        type="text"
        placeholder="Latitude"
        value={manualLat}
        onChange={(e) => setManualLat(e.target.value)}
        style={{ padding: 8, width: 140 }}
      />
      <input
        type="text"
        placeholder="Longitude"
        value={manualLng}
        onChange={(e) => setManualLng(e.target.value)}
        style={{ padding: 8, width: 140 }}
      />
      <select
        value={disaster}
        onChange={(e) => setDisaster(e.target.value)}
        style={{ padding: 8 }}
      >
        <option value="earthquake">Earthquake</option>
        <option value="flood">Flood</option>
        <option value="cyclone">Cyclone/Storm</option>
        <option value="tsunami">Tsunami</option>
      </select>
      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{
          padding: "8px 16px",
          backgroundColor: submitting ? "#aaa" : "#333",
          color: "white",
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Triggering..." : "Trigger Alert"}
      </button>
    </div>
  );
};

export default ManualTriggerForm;
