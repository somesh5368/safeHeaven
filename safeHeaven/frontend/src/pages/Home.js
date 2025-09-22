// src/pages/Home.js
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode";

import ManualTriggerForm from "../components/ManualTriggerForm";
import AlertBanner from "../components/AlertBanner";
import MapView from "../components/MapView";
import DisasterDashboard from "../components/DisasterDashboard";

import DISASTER_CONFIG from "../utils/disasterConfig";
import { fetchWeather as fetchWeatherUtil } from "../utils/fetchWeather";

// Helper: pick the most recent available sample within the 5-day window
const pickMostRecentAvailable = (series) => {
  for (let i = series.length - 1; i >= 0; i--) {
    const d = series[i];
    if (!d) continue;
    if (d.rain != null || d.humidity != null || d.temperature != null) return d;
  }
  return series[series.length - 1] || null;
};

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);

  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }; // simple logout flow [web:2]

  useEffect(() => {
    if (!token) return;
    try {
      setUser(jwtDecode(token));
    } catch {
      // ignore bad token
    }
  }, [token]); // decode on token change [web:2]

  const fetchWeather = useCallback(async (lat, lng) => {
    setLoading(true);
    setLocationError("");
    try {
      const data = await fetchWeatherUtil(lat, lng);
      setWeather(data);
    } catch (e) {
      setLocationError("Weather fetch failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, []); // POWER daily data: stable when ending at yesterday [web:5]

  useEffect(() => {
    if (!token) return;
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setCoords({ latitude, longitude });
        await fetchWeather(latitude, longitude); // daily endpoint, 5-day window [web:5]
      },
      () => setLocationError("Unable to get your location. Please allow location access.")
    );
  }, [token, fetchWeather]);

  // Manual check: no disaster select; always check all hazards for typed lat/lon
  const handleManualCheck = async () => {
    const latNum = Number(manualLat);
    const lngNum = Number(manualLng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      alert("Enter valid numeric latitude and longitude");
      return;
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      alert("Lat must be -90..90 and Lng -180..180");
      return;
    }
    if (!token) {
      alert("Please login first");
      return;
    }

    setSubmitting(true);
    try {
      // Update map immediately
      setCoords({ latitude: latNum, longitude: lngNum });

      // Fetch weather for these coords
      await fetchWeather(latNum, lngNum);

      // Auto alert if any hazard reaches warning/critical will be triggered by the Dashboard handler below
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Dashboard sends back most urgent hazard; raise temporary banner
  const handleDashboardAlert = (type, level) => {
    const cfg = DISASTER_CONFIG[type];
    if (!cfg) return;
    setAlertBanner({
      ...cfg,
      title: `${cfg.title} - ${level.toUpperCase()}`,
      coordinates: coords
        ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        : "-",
      timestamp: new Date().toLocaleString(),
    });
    setTimeout(() => setAlertBanner(null), 10000);
  };

  const renderValue = (label, value, unit) => {
    const txt =
      value == null ? "Data unavailable" : `${value} ${unit ?? ""}`.trim();
    return (
      <>
        <strong>{label}</strong> {txt}
      </>
    );
  };

  // For the small “Last 5 Days Weather” list, show latest available first line as a hint
  const latestAvailable = useMemo(
    () => pickMostRecentAvailable(weather),
    [weather]
  );

  return (
    <div style={{ maxWidth: 1160, margin: "32px auto 40px", padding: "0 16px" }}>
      <AlertBanner banner={alertBanner} onClose={() => setAlertBanner(null)} />

      <h1 style={{ textAlign: "center", marginBottom: 16 }}>
        Welcome to SafeHeaven App
      </h1>

      {token ? (
        <>
          <p style={{ marginBottom: 12 }}>
            Logged in as <strong>{user?.name}</strong> ({user?.email})
          </p>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleLogout}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                backgroundColor: "red",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 16,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Logout
            </button>
          </div>

          <div style={{ margin: "16px 0 22px" }}>
            <ManualTriggerForm
              manualLat={manualLat}
              setManualLat={setManualLat}
              manualLng={manualLng}
              setManualLng={setManualLng}
              onSubmit={handleManualCheck}
              submitting={submitting}
            />
          </div>

          {coords && (
            <div style={{ margin: "8px 0 22px" }}>
              <MapView
                latitude={coords.latitude}
                longitude={coords.longitude}
                title="Your Location"
                subtitle={`Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`}
              />
            </div>
          )}

          {coords && (
            <div style={{ margin: "0 0 22px" }}>
              <DisasterDashboard
                coords={coords}
                dailyWeather={weather}
                onAlert={handleDashboardAlert}
              />
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            {loading && <p>Fetching last 5 days weather from NASA...</p>}
            {locationError && <p style={{ color: "red" }}>{locationError}</p>}
          </div>

          {weather.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <h2 style={{ textAlign: "left", margin: "0 0 10px 0" }}>
                Last 5 Days Weather (NASA POWER API)
              </h2>
              {latestAvailable?.date && (
                <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
                  Showing latest available values within last 5 days. Data date: {latestAvailable.date}
                </div>
              )}
              {weather.map((day) => (
                <div
                  key={day.date}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "10px",
                    margin: "10px auto",
                    width: "300px",
                    textAlign: "left",
                  }}
                >
                  <div>📅 <strong>Date:</strong> {day.date}</div>
                  <div>🌡 {renderValue("Temp:", day.temperature, "°C")}</div>
                  <div>💧 {renderValue("Humidity:", day.humidity, "%")}</div>
                  <div>🌧 {renderValue("Rain:", day.rain, "mm")}</div>
                </div>
              ))}
            </div>
          ) : (
            !loading && <p>No weather data found for the last 5 days.</p>
          )}
        </>
      ) : (
        <>
          <p style={{ textAlign: "center" }}>Please login or register.</p>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                marginRight: 10,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Register
            </button>
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={() =>
                (window.location.href = "http://localhost:5000/auth/google")
              }
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                backgroundColor: "#DB4437",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                marginTop: 15,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Sign in with Google
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
