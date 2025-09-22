import React, { useEffect, useMemo, useState } from "react";
import { fetchWeather } from "../utils/fetchWeather";

const valOr0 = (v) => (v == null ? 0 : Number(v));

const deriveFloodStatus = (recent=[]) => {
  const last = recent.slice(-1)[0];
  const r = valOr0(last?.rain);
  if (r >= 80) return "critical";
  if (r >= 30) return "warning";
  return "neutral";
};

const deriveCycloneStatus = (recent=[]) => {
  const last = recent.slice(-1)[0];
  const r = valOr0(last?.rain);
  if (r >= 60) return "warning";
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

const AutoHazardEvaluator = ({ coords, onResult }) => {
  const [daily, setDaily] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!coords?.latitude || !coords?.longitude) return;
      setLoading(true);
      try {
        const data = await fetchWeather(coords.latitude, coords.longitude);
        if (!alive) return;
        setDaily(data || []);
        setUpdatedAt(new Date().toLocaleString());
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("AutoHazardEvaluator fetch error", e);
        if (!alive) return;
        setDaily([]);
        setUpdatedAt(new Date().toLocaleString());
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [coords?.latitude, coords?.longitude]);

  const recent = useMemo(
    () => daily.map(d => ({
      date: d.date,
      temp: d.temperature == null ? null : Number(d.temperature),
      humidity: d.humidity == null ? null : Number(d.humidity),
      rain: d.rain == null ? null : Number(d.rain),
    })), [daily]
  );

  // Latest available sample within the 5-day window
  const recentValid = useMemo(() => {
    for (let i = recent.length - 1; i >= 0; i--) {
      const r = recent[i];
      if (r && (r.rain != null || r.humidity != null || r.temp != null)) return r;
    }
    return recent[recent.length - 1] || null;
  }, [recent]);

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
      updatedAt
    };
  }, [recent, recentValid, updatedAt]);

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
      updatedAt
    };
  }, [recent, recentValid, updatedAt]);

  const earthquake = useMemo(() => ({
    status: deriveStaticStatus(),
    lines: [
      { label: "Seismic feed", value: "Not connected" },
      { label: "Local report", value: "No report" },
    ],
    note: "Use manual/official alerts to update",
    updatedAt
  }), [updatedAt]);

  const tsunami = useMemo(() => ({
    status: deriveStaticStatus(),
    lines: [
      { label: "Tsunami feed", value: "Not connected" },
      { label: "Coastal risk", value: "Unknown" },
    ],
    note: "Official bulletins required",
    updatedAt
  }), [updatedAt]);

  useEffect(() => {
    const list = [
      { key: "flood", level: flood.status },
      { key: "cyclone", level: cyclone.status },
      { key: "earthquake", level: earthquake.status },
      { key: "tsunami", level: tsunami.status },
    ];
    const order = { critical: 2, warning: 1, neutral: 0 };
    const top = list.sort((a, b) => order[b.level] - order[a.level])[0];
    onResult?.({ loading, daily, flood, cyclone, earthquake, tsunami, top });
  }, [loading, daily, flood, cyclone, earthquake, tsunami, onResult]);

  return null;
};

export default AutoHazardEvaluator;
