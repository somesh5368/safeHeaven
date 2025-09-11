// frontend/src/pages/Home.js
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  useEffect(() => {
    if (token) {
      if (navigator.geolocation) {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCoords({ latitude, longitude });

            // format today and 5 days ago
            const today = new Date();
            const end = today.toISOString().split('T')[0].replace(/-/g, '');
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 4); // 5 days range including today
            const start = startDate.toISOString().split('T')[0].replace(/-/g, '');

            try {
              const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR&community=AG&start=${start}&end=${end}&latitude=${latitude}&longitude=${longitude}&format=JSON`;

              const res = await fetch(url);
              const data = await res.json();

              const params = data?.properties?.parameter;

              if (params && params.T2M) {
                const weatherArray = Object.keys(params.T2M).map((date) => ({
                  date,
                  temperature: params.T2M[date],
                  humidity: params.RH2M[date],
                  rain: params.PRECTOTCORR[date],
                }));
                setWeather(weatherArray);
              } else {
                setWeather([]);
              }
              setLoading(false);
            } catch (err) {
              console.error('Error fetching NASA weather data:', err);
              setLocationError('Error fetching weather from NASA. Please try again later.');
              setLoading(false);
            }
          },
          (err) => {
            console.error('Geolocation error:', err);
            setLocationError('Unable to get your location. Please allow location access.');
            setLoading(false);
          }
        );
      } else {
        setLocationError('Geolocation is not supported by your browser.');
      }
    }
  }, [token]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to SafeHeaven App</h1>

      {token ? (
        <>
          <p>You are logged in!</p>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            Logout
          </button>

          {coords && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Your Location</h3>
              <p>📍 Latitude: {coords.latitude.toFixed(6)}</p>
              <p>📍 Longitude: {coords.longitude.toFixed(6)}</p>
            </div>
          )}

          {loading && <p>Fetching last 5 days weather from NASA...</p>}

          {locationError && <p style={{ color: 'red' }}>{locationError}</p>}

          {weather.length > 0 ? (
            <div style={{ marginTop: '20px' }}>
              <h2>Last 5 Days Weather (NASA POWER API)</h2>
              {weather.map((day) => (
                <div
                  key={day.date}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    padding: '10px',
                    margin: '10px auto',
                    width: '300px',
                    textAlign: 'left',
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
          <p>Please login or register.</p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Register
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
