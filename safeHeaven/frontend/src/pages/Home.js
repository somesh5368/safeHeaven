// src/pages/Home.js
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

import ManualTriggerForm from "../components/ManualTriggerForm";
import AlertBanner from "../components/AlertBanner";
import MapView from "../components/MapView";
import DisasterDashboard from "../components/DisasterDashboard";

import DISASTER_CONFIG from "../utils/disasterConfig";
import { fetchWeather as fetchWeatherUtil } from "../utils/fetchWeather";

const ALLOWED = new Set(["earthquake", "flood", "cyclone", "tsunami"]); // strict allowlist [web:114]

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
  const [disaster, setDisaster] = useState("earthquake");
  const [submitting, setSubmitting] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }; // basic logout [web:114]

  useEffect(() => {
    if (!token) return;
    try {
      setUser(jwtDecode(token));
    } catch {
      // ignore bad token
    }
  }, [token]); // decode on token change [web:319]

  const fetchWeather = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const data = await fetchWeatherUtil(lat, lng);
      setWeather(data);
    } catch {
      setLocationError("Weather fetch failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, []); // POWER daily data should end at “yesterday” for stability [web:243]

  useEffect(() => {
    if (!token) return;
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setCoords({ latitude, longitude });
        await fetchWeather(latitude, longitude);
      },
      () => setLocationError("Unable to get your location. Please allow location access.")
    );
  }, [token, fetchWeather]); // load current location on login [web:114]

  const handleManualTrigger = async () => {
    const latNum = Number(manualLat);
    const lngNum = Number(manualLng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      alert("Enter valid numeric latitude and longitude");
      return;
    } // strict numeric validation [web:114]
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      alert("Lat must be -90..90 and Lng -180..180");
      return;
    } // bounds check [web:114]

    const type = String(disaster || "").toLowerCase().trim();
    if (!ALLOWED.has(type)) {
      alert("Invalid disaster type");
      return;
    } // normalized, allowlisted payload [web:114]

    if (!token) {
      alert("Please login first");
      return;
    } // require auth [web:114]

    setSubmitting(true);
    try {
      // Update map immediately for UX
      setCoords({ latitude: latNum, longitude: lngNum });

      // Weather is informational and decoupled from alert flow
      await fetchWeather(latNum, lngNum); // POWER daily data [web:243]

      // Trigger backend alert only with normalized payload
      const res = await fetch("http://localhost:5000/api/trigger-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: latNum,
          longitude: lngNum,
          disaster: type,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Trigger failed (${res.status})`);
      } // banner only on success [web:114]

      const cfg = DISASTER_CONFIG[type];
      setAlertBanner({
        ...cfg,
        coordinates: `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`,
        timestamp: new Date().toLocaleString(),
      });
      setTimeout(() => setAlertBanner(null), 10000);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div style={{ maxWidth: 1160, margin: "32px auto 40px", padding: "0 16px" }}>
      <AlertBanner banner={alertBanner} onClose={() => setAlertBanner(null)} />

      <h1 style={{ textAlign: "center", marginBottom: 16 }}>Welcome to SafeHeaven App</h1>

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
          </div> {/* centered and vertically aligned text in button [web:393][web:409] */}

          <div style={{ margin: "16px 0 22px" }}>
            <ManualTriggerForm
              manualLat={manualLat}
              setManualLat={setManualLat}
              manualLng={manualLng}
              setManualLng={setManualLng}
              disaster={disaster}
              setDisaster={setDisaster}
              onSubmit={handleManualTrigger}
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
                  <strong>📅 Date:</strong> {day.date} <br />
                  🌡 Temp: {day.temperature} °C <br />
                  💧 Humidity: {day.humidity} % <br />
                  🌧 Rain: {day.rain} mm
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
          </div> {/* center-aligned auth buttons [web:393][web:409] */}

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={() => (window.location.href = "http://localhost:5000/auth/google")}
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
          </div> {/* consistent centering approach [web:393][web:409] */}
        </>
      )}
    </div>
  );
}

export default Home;
