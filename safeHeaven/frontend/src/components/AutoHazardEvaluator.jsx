// src/components/AutoHazardEvaluator.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchWeather } from "../utils/fetchWeather";
import { fetchEarthquakes } from "../utils/fetchEarthquakes";
import { fetchTsunamiAlerts } from "../utils/fetchTsunamiAlerts";

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

const fmtVal = (v, unit, digits=1) => {
  if (v == null) return "Data unavailable";
  const n = Number(v);
  if (!Number.isFinite(n)) return "Data unavailable";
  if (unit === "%") return `${n.toFixed(0)} %`;
  if (unit === "mm") return `${n.toFixed(1)} mm`;
  return `${n.toFixed(digits)} °C`;
};

export default function AutoHazardEvaluator({ coords, onResult }) {
  const [daily, setDaily] = useState([]);
  const [quakes, setQuakes] = useState([]);
  const [tsu, setTsu] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);

  // source-specific errors for UI visibility
  const [wxErr, setWxErr] = useState("");
  const [eqErr, setEqErr] = useState("");
  const [tsuErr, setTsuErr] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!coords?.latitude || !coords?.longitude) return;
      setLoading(true);
      setWxErr(""); setEqErr(""); setTsuErr("");
      try {
        const [wx, eq, ta] = await Promise.all([
          fetchWeather(coords.latitude, coords.longitude).catch(e => { setWxErr(e?.message || "Weather error"); return []; }),
          fetchEarthquakes({ lat: coords.latitude, lon: coords.longitude, hours: 48, radiusKm: 500, minmag: 3.0 }).catch(e => { setEqErr(e?.message || "USGS error"); return []; }),
          fetchTsunamiAlerts().catch(e => { setTsuErr(e?.message || "NWS error"); return []; })
        ]);
        if (!alive) return;
        setDaily(wx || []);
        setQuakes(eq || []);
        setTsu(ta || []);
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

  const recentValid = useMemo(() => {
    for (let i = recent.length - 1; i >= 0; i--) {
      const r = recent[i];
      if (r && (r.rain != null || r.humidity != null || r.temp != null)) return r;
    }
    return recent[recent.length - 1] || null;
  }, [recent]);

  const flood = useMemo(() => {
    const st = deriveFloodStatus(recent);
    const lines = [
      { label: "Rain (latest avail.)", value: fmtVal(recentValid?.rain, "mm") },
      { label: "Humidity (latest avail.)", value: fmtVal(recentValid?.humidity, "%") },
      { label: "Temp (latest avail.)", value: fmtVal(recentValid?.temp, "°C") },
      { label: "Data date", value: recentValid?.date || "Data unavailable" },
    ];
    if (wxErr) lines.unshift({ label: "POWER status", value: wxErr });
    return { status: st, lines, note: "Latest available day within last 5 days (NASA POWER)", updatedAt };
  }, [recent, recentValid, updatedAt, wxErr]);

  const cyclone = useMemo(() => {
    const st = deriveCycloneStatus(recent);
    const lines = [
      { label: "Rain (latest avail.)", value: fmtVal(recentValid?.rain, "mm") },
      { label: "Humidity (latest avail.)", value: fmtVal(recentValid?.humidity, "%") },
      { label: "Temp (latest avail.)", value: fmtVal(recentValid?.temp, "°C") },
      { label: "Data date", value: recentValid?.date || "Data unavailable" },
    ];
    if (wxErr) lines.unshift({ label: "POWER status", value: wxErr });
    return { status: st, lines, note: "Latest available day within last 5 days (NASA POWER)", updatedAt };
  }, [recent, recentValid, updatedAt, wxErr]);

  const eqStatus = useMemo(() => {
    const anyStrong = quakes.some(q => (q.mag ?? 0) >= 5.0);
    const cluster = quakes.filter(q => (q.mag ?? 0) >= 4.0).length >= 3;
    return anyStrong || cluster ? "warning" : "neutral";
  }, [quakes]);

  const earthquake = useMemo(() => {
    const lines = [
      { label: "Recent quakes (48h)", value: quakes.length || 0 },
      { label: "Strongest mag", value: quakes.length ? (Math.max(...quakes.map(q => q.mag || 0)).toFixed(1)) : "None" },
    ];
    if (eqErr) lines.unshift({ label: "USGS status", value: eqErr });
    return { status: eqStatus, lines, note: "USGS 48h within 500 km", updatedAt };
  }, [eqStatus, quakes, updatedAt, eqErr]);

  const tsunami = useMemo(() => {
    const lines = [
      { label: "Active advisories", value: tsu.length || 0 },
      { label: "Most recent", value: tsu[0]?.headline || "None" },
    ];
    if (tsuErr) lines.unshift({ label: "NWS status", value: tsuErr });
    return { status: (tsu.length > 0 ? "warning" : "neutral"), lines, note: "NWS tsunami alerts", updatedAt };
  }, [tsu, updatedAt, tsuErr]);

  useEffect(() => {
    const order = { critical: 2, warning: 1, neutral: 0 };
    const list = [
      { key: "flood", level: flood.status },
      { key: "cyclone", level: cyclone.status },
      { key: "earthquake", level: earthquake.status },
      { key: "tsunami", level: tsunami.status },
    ];
    const top = list.sort((a, b) => order[b.level] - order[a.level])[0];
    onResult?.({ loading, daily, quakes, tsu, flood, cyclone, earthquake, tsunami, top });
  }, [loading, daily, quakes, tsu, flood, cyclone, earthquake, tsunami, onResult]);

  return null;
}
