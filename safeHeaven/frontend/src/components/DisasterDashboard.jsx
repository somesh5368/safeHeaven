import React, { useEffect, useMemo, useState } from "react";
import DisasterCard from "./DisasterCard";

const valOr0 = (v) => (v == null ? 0 : Number(v));
const deriveFloodStatus = (recentDaily=[]) => {
  const last = recentDaily.slice(-1)[0];
  const lastRain = valOr0(last?.rain);
  if (lastRain >= 80) return "critical";
  if (lastRain >= 30) return "warning";
  return "neutral";
};
const deriveCycloneStatus = (recentDaily=[]) => {
  const last = recentDaily.slice(-1)[0];
  const lastRain = valOr0(last?.rain);
  if (lastRain >= 60) return "warning";
  return "neutral";
};
const deriveStaticStatus = () => "neutral";
const fmtVal = (v, unit, digits=1) => {
  if (v == null) return "Data unavailable";
  const n = Number(v);
  if (!Number.isFinite(n)) return "Data unavailable";
  if (unit === "%") return `${n.toFixed(0)} %`;
  if (unit === "mm") return `${n.toFixed(1)} mm`;
  return `${n.toFixed(digits)} °C`;
};

// pick latest available sample
const pickMostRecentAvailable = (series) => {
  for (let i = series.length - 1; i >= 0; i--) {
    const r = series[i];
    if (r && (r.rain != null || r.humidity != null || r.temp != null)) return r;
  }
  return series[series.length - 1] || null;
};

const DisasterDashboard = ({ coords, dailyWeather = [], onAlert }) => {
  const [now, setNow] = useState(() => new Date().toLocaleString());
  useEffect(() => { const t = setInterval(() => setNow(new Date().toLocaleString()), 30000); return () => clearInterval(t); }, []);

  const recent = useMemo(
    () => dailyWeather.map((d) => ({
      date: d.date,
      temp: d.temperature == null ? null : Number(d.temperature),
      humidity: d.humidity == null ? null : Number(d.humidity),
      rain: d.rain == null ? null : Number(d.rain),
    })),
    [dailyWeather]
  );

  const recentValid = useMemo(() => pickMostRecentAvailable(recent), [recent]);

  const flood = useMemo(() => {
    const st = deriveFloodStatus(recent);
    return {
      status: st,
      lines: [
        { label: "Rain (latest avail.)", value: fmtVal(recentValid?.rain, "mm") },
        { label: "Humidity (latest avail.)", value: fmtVal(recentValid?.humidity, "%") },
        { label: "Temp (latest avail.)", value: fmtVal(recentValid?.temp, "°C") },
        { label: "Data date", value: recentValid?.date || "Data unavailable" },
      ],
      note: "Latest available day within last 5 days (NASA POWER)",
      updatedAt: now,
    };
  }, [recent, recentValid, now]);

  const cyclone = useMemo(() => {
    const st = deriveCycloneStatus(recent);
    return {
      status: st,
      lines: [
        { label: "Rain (latest avail.)", value: fmtVal(recentValid?.rain, "mm") },
        { label: "Humidity (latest avail.)", value: fmtVal(recentValid?.humidity, "%") },
        { label: "Temp (latest avail.)", value: fmtVal(recentValid?.temp, "°C") },
        { label: "Data date", value: recentValid?.date || "Data unavailable" },
      ],
      note: "Latest available day within last 5 days (NASA POWER)",
      updatedAt: now,
    };
  }, [recent, recentValid, now]);

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

  useEffect(() => {
    const statuses = [
      { key: "flood", level: flood.status },
      { key: "cyclone", level: cyclone.status },
      { key: "earthquake", level: earthquake.status },
      { key: "tsunami", level: tsunami.status },
    ];
    const hit = statuses.find((s) => s.level === "warning" || s.level === "critical");
    if (hit) onAlert?.(hit.key, hit.level);
  }, [flood.status, cyclone.status, earthquake.status, tsunami.status, onAlert]);

  // Inline responsive styles: 2 columns normally, 1 column on small screens
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

      <div
        style={{
          ...gridStyle,
          // Small screens fallback to 1 column using a simple match
          ...(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 680px)").matches
            ? { gridTemplateColumns: "repeat(1, 1fr)" }
            : null),
        }}
      >
        <DisasterCard type="earthquake" title="Earthquake" coords={coords} data={earthquake} status={earthquake.status} onViewDetails={() => {}} />
        <DisasterCard type="flood" title="Flood" coords={coords} data={flood} status={flood.status} onViewDetails={() => {}} />
        <DisasterCard type="cyclone" title="Cyclone/Storm" coords={coords} data={cyclone} status={cyclone.status} onViewDetails={() => {}} />
        <DisasterCard type="tsunami" title="Tsunami" coords={coords} data={tsunami} status={tsunami.status} onViewDetails={() => {}} />
      </div>
    </div>
  );
};

export default DisasterDashboard;
