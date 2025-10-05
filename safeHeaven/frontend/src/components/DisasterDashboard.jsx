// src/components/DisasterDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import DisasterCard from "./DisasterCard";

function DisasterDashboard({ coords, dailyWeather, onAlert }) {
  const [earthquakeData, setEarthquakeData] = useState(null);
  const [tsunamiData, setTsunamiData] = useState(null);

  // Fetch USGS earthquakes near coords (optional)
  const fetchUSGSEarthquakes = useCallback(async () => {
    if (!coords) return;
    try {
      // Example: M2.5+ earthquakes in last 24h within ~500km radius
      const { latitude, longitude } = coords;
      const radius = 5; // degrees (approx 500km at equator)
      const minLat = latitude - radius, maxLat = latitude + radius;
      const minLon = longitude - radius, maxLon = longitude + radius;
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${new Date(Date.now() - 86400000).toISOString()}&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&minmagnitude=2.5`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`USGS ${r.status}`);
      const geo = await r.json();
      const count = geo?.features?.length || 0;
      const maxMag = count > 0 ? Math.max(...geo.features.map(f => f.properties?.mag || 0)) : 0;
      setEarthquakeData({ count, maxMag, updated: new Date().toLocaleTimeString() });
    } catch (e) {
      console.error("USGS fetch error", e);
      setEarthquakeData(null);
    }
  }, [coords]);

  // Fetch NWS tsunami alerts (optional; US-focused)
  const fetchNWSTsunami = useCallback(async () => {
    try {
      // NWS CAP alerts feed for tsunami warnings
      const url = "https://api.weather.gov/alerts/active?event=Tsunami%20Warning";
      const r = await fetch(url);
      if (!r.ok) throw new Error(`NWS ${r.status}`);
      const j = await r.json();
      const count = j?.features?.length || 0;
      setTsunamiData({ count, updated: new Date().toLocaleTimeString() });
    } catch (e) {
      console.error("NWS tsunami fetch error", e);
      setTsunamiData(null);
    }
  }, []);

  useEffect(() => {
    fetchUSGSEarthquakes();
    fetchNWSTsunami();
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchUSGSEarthquakes();
      fetchNWSTsunami();
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchUSGSEarthquakes, fetchNWSTsunami]);

  // Simple rules: earthquake card critical if maxMag>=5.5 and count>0, warning if count>0
  const eqStatus = earthquakeData
    ? earthquakeData.maxMag >= 5.5 ? "critical" : earthquakeData.count > 0 ? "warning" : "neutral"
    : "neutral";

  // Tsunami card critical if any active warnings
  const tsunamiStatus = tsunamiData && tsunamiData.count > 0 ? "critical" : "neutral";

  // Placeholder: Flood/Cyclone cards from weather (you can refine with real logic)
  const floodStatus = dailyWeather.some(d => d.rain && d.rain > 50) ? "warning" : "neutral";
  const cycloneStatus = "neutral"; // replace with actual logic if wind/pressure data available

  const handleDispatch = ({ type, status, coords: c, data }) => {
    console.log("Dispatching emergency alert:", { type, status, coords: c, data });
    // TODO: call backend API to send SMS/calls/push to emergency contacts
    alert(`🚨 Alert dispatched: ${type} (${status})`);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
      <DisasterCard
        type="earthquake"
        title="Earthquake Risk"
        coords={coords}
        status={eqStatus}
        data={{
          lines: earthquakeData
            ? [
                { label: "Recent events (24h)", value: earthquakeData.count },
                { label: "Max magnitude", value: earthquakeData.maxMag.toFixed(1) },
              ]
            : [],
          updatedAt: earthquakeData?.updated || "N/A",
          note: "USGS real-time data"
        }}
        onViewDetails={() => alert("Earthquake details modal")}
        onDispatchEmergency={handleDispatch}
      />

      <DisasterCard
        type="tsunami"
        title="Tsunami Alert"
        coords={coords}
        status={tsunamiStatus}
        data={{
          lines: tsunamiData
            ? [{ label: "Active warnings", value: tsunamiData.count }]
            : [],
          updatedAt: tsunamiData?.updated || "N/A",
          note: "NWS CAP feed"
        }}
        onViewDetails={() => alert("Tsunami details modal")}
        onDispatchEmergency={handleDispatch}
      />

      <DisasterCard
        type="flood"
        title="Flood Risk"
        coords={coords}
        status={floodStatus}
        data={{
          lines: [
            { label: "Heavy rain detected", value: dailyWeather.some(d => d.rain > 50) ? "Yes" : "No" },
          ],
          updatedAt: dailyWeather[0]?.date || "N/A",
          note: "NASA POWER precipitation data"
        }}
        onViewDetails={() => alert("Flood details modal")}
        onDispatchEmergency={handleDispatch}
      />

      <DisasterCard
        type="cyclone"
        title="Cyclone/Storm Risk"
        coords={coords}
        status={cycloneStatus}
        data={{
          lines: [
            { label: "Status", value: "Monitoring" },
          ],
          updatedAt: new Date().toLocaleTimeString(),
          note: "EONET severe storms + weather"
        }}
        onViewDetails={() => alert("Cyclone details modal")}
        onDispatchEmergency={handleDispatch}
      />
    </div>
  );
}

export default DisasterDashboard;
