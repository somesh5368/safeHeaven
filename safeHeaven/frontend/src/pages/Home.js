// frontend/src/pages/Home.js
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import MapboxMap from "../components/mapBoxMap";

function Home() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);

  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, [token]);

  // Geolocation: live coords capture
  useEffect(() => {
    if (!token) return;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCoords({ latitude, longitude });
      },
      () => setLocationError("Unable to get your location. Please allow location access.")
    );
  }, [token]);

  // NASA weather fetch (same as before)
  useEffect(() => {
    if (!token) return;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        const today = new Date();
        const end = today.toISOString().slice(0, 10).replace(/-/g, "");
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 4);
        const start = startDate.toISOString().slice(0, 10).replace(/-/g, "");

        try {
          const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR&community=AG&start=${start}&end=${end}&latitude=${latitude}&longitude=${longitude}&format=JSON`;
          const res = await fetch(url);
          const data = await res.json();
          const params = data?.properties?.parameter;

          setWeather(
            params && params.T2M
              ? Object.keys(params.T2M).map((date) => ({
                  date,
                  temperature: params.T2M[date],
                  humidity: params.RH2M[date],
                  rain: params.PRECTOTCORR[date],
                }))
              : []
          );
          setLoading(false);
        } catch (err) {
          console.error("Error fetching NASA weather data:", err);
          setLocationError("Error fetching weather from NASA. Please try again later.");
          setLoading(false);
        }
      },
      () => {
        setLocationError("Unable to get your location. Please allow location access.");
        setLoading(false);
      }
    );
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      <h1>Welcome to SafeHeaven App</h1>

      {token ? (
        <>
          <p>You are logged in as <strong>{user?.name}</strong> ({user?.email})</p>
          <button
            onClick={handleLogout}
            style={{ padding: "10px 20px", backgroundColor: "red", color: "white", border: "none", cursor: "pointer", marginBottom: "20px" }}
          >
            Logout
          </button>

          <div style={{ maxWidth: 900, margin: "0 auto 16px" }}>
            <MapboxMap
              center={{
                longitude: coords?.longitude ?? 77.5946,
                latitude: coords?.latitude ?? 12.9716
              }}
              markerCoords={coords}         // live current coords
              zoom={coords ? 14 : 11}       // zoom in when coords available
              height="60vh"
            />
          </div>

          {coords && (
            <div style={{ marginBottom: 12 }}>
              <h3>Your Location</h3>
              <p>📍 Lat: {coords.latitude.toFixed(6)} | Lng: {coords.longitude.toFixed(6)}</p>
            </div>
          )}

          {loading && <p>Fetching last 5 days weather from NASA...</p>}
          {locationError && <p style={{ color: "red" }}>{locationError}</p>}

          {weather.length > 0 ? (
            <div style={{ marginTop: "20px" }}>
              <h2>Last 5 Days Weather (NASA POWER API)</h2>
              {weather.map((day) => (
                <div key={day.date} style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "10px", margin: "10px auto", width: "300px", textAlign: "left" }}>
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
        <p>Please login or register.</p>
      )}
    </div>
  );
}

export default Home;
