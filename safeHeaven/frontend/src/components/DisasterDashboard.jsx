// src/components/DisasterDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import DisasterCard from "./DisasterCard";

// Simple status derivation helpers (tweak thresholds as needed)
const deriveFloodStatus = (recentDaily = []) => {
  const last = recentDaily.slice(-1)[0];
  const lastRain = last?.rain ?? 0;
  if (lastRain >= 80) return "critical";
  if (lastRain >= 30) return "warning";
  return "neutral";
};

const deriveCycloneStatus = (recentDaily = []) => {
  const last = recentDaily.slice(-1)[0];
  const lastRain = last?.rain ?? 0;
  if (lastRain >= 60) return "warning";
  return "neutral";
};

const deriveStaticStatus = () => "neutral";

const DisasterDashboard = ({ coords, dailyWeather = [], onAlert }) => {
  // Show a periodically updating timestamp so cards feel live
  const [now, setNow] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleString()), 30000);
    return () => clearInterval(t);
  }, []);

  // Normalize daily weather once
  const recent = useMemo(
    () =>
      dailyWeather.map((d) => ({
        date: d.date,
        temp: Number(d.temperature) || 0,
        humidity: Number(d.humidity) || 0,
        rain: Number(d.rain) || 0,
      })),
    [dailyWeather]
  );

  // Compute per-card data objects
  const flood = useMemo(() => {
    const st = deriveFloodStatus(recent);
    const last = recent.slice(-1)[0];
    return {
      status: st,
      lines: [
        { label: "Last day rain", value: `${(last?.rain ?? 0).toFixed(1)} mm` },
        { label: "Humidity", value: `${(last?.humidity ?? 0).toFixed(0)} %` },
        { label: "Temp", value: `${(last?.temp ?? 0).toFixed(1)} °C` },
      ],
      note: "Daily aggregates from NASA POWER",
      updatedAt: now,
    };
  }, [recent, now]);

  const cyclone = useMemo(() => {
    const st = deriveCycloneStatus(recent);
    const last = recent.slice(-1)[0];
    return {
      status: st,
      lines: [
        { label: "Recent rain", value: `${(last?.rain ?? 0).toFixed(1)} mm` },
        { label: "Humidity", value: `${(last?.humidity ?? 0).toFixed(0)} %` },
        { label: "Temp", value: `${(last?.temp ?? 0).toFixed(1)} °C` },
      ],
      note: "Proxy until wind/pressure feeds added",
      updatedAt: now,
    };
  }, [recent, now]);

  const earthquake = useMemo(
    () => ({
      status: deriveStaticStatus(),
      lines: [
        { label: "Seismic feed", value: "Not connected" },
        { label: "Local report", value: "No report" },
      ],
      note: "Use manual/official alerts to update",
      updatedAt: now,
    }),
    [now]
  );

  const tsunami = useMemo(
    () => ({
      status: deriveStaticStatus(),
      lines: [
        { label: "Tsunami feed", value: "Not connected" },
        { label: "Coastal risk", value: "Unknown" },
      ],
      note: "Official bulletins required",
      updatedAt: now,
    }),
    [now]
  );

  // Alert when any card enters warning/critical. Depend on primitive statuses to avoid unnecessary effect triggers.
  useEffect(() => {
    const statuses = [
      { key: "flood", level: flood.status },
      { key: "cyclone", level: cyclone.status },
      { key: "earthquake", level: earthquake.status },
      { key: "tsunami", level: tsunami.status },
    ];
    const hit = statuses.find((s) => s.level === "warning" || s.level === "critical");
    if (hit) onAlert?.(hit.key, hit.level);
    // Only depend on primitive status strings and onAlert reference
  }, [flood.status, cyclone.status, earthquake.status, tsunami.status, onAlert]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 14px" }}>
      <h2 style={{ textAlign: "left", margin: "20px 0 14px", fontSize: 20, fontWeight: 800 }}>
        Hazard Dashboard
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        <DisasterCard
          type="earthquake"
          title="Earthquake"
          coords={coords}
          data={earthquake}
          status={earthquake.status}
          onViewDetails={() => {}}
        />
        <DisasterCard
          type="flood"
          title="Flood"
          coords={coords}
          data={flood}
          status={flood.status}
          onViewDetails={() => {}}
        />
        <DisasterCard
          type="cyclone"
          title="Cyclone/Storm"
          coords={coords}
          data={cyclone}
          status={cyclone.status}
          onViewDetails={() => {}}
        />
        <DisasterCard
          type="tsunami"
          title="Tsunami"
          coords={coords}
          data={tsunami}
          status={tsunami.status}
          onViewDetails={() => {}}
        />
      </div>
    </div>
  );
};

export default DisasterDashboard;
