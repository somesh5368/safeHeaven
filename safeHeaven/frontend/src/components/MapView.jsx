// src/components/MapView.jsx
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import "mapbox-gl/dist/mapbox-gl.css";

function MapView({ latitude, longitude, title, subtitle }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(true);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  const reverseGeocode = useCallback(async (lng, lat) => {
    if (!token) return "";
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&access_token=${token}`;
      const r = await fetch(url);
      if (!r.ok) return "";
      const j = await r.json();
      return j?.features?.[0]?.place_name || "";
    } catch {
      return "";
    }
  }, [token]);

  const setMarkerWithName = useCallback(async (lng, lat) => {
    if (!mapRef.current) return;

    // Remove old marker if exists
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Create custom marker element
    const el = document.createElement('div');
    el.innerHTML = '📍';
    el.style.fontSize = '32px';
    el.style.cursor = 'pointer';
    el.style.filter = 'drop-shadow(0 0 8px rgba(255, 69, 58, 0.8))';

    // Create new marker
    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    const name = await reverseGeocode(lng, lat);
    setPlace(name);

    // Remove old popup if exists
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // Create popup content
    const popupContent = `
      <div style="
        background: linear-gradient(135deg, rgba(255, 69, 58, 0.95), rgba(255, 107, 53, 0.95));
        padding: 15px;
        border-radius: 10px;
        color: white;
        font-family: 'Segoe UI', Arial, sans-serif;
        min-width: 200px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
          🛰️ Monitoring Location
        </div>
        <div style="font-size: 13px; line-height: 1.6; opacity: 0.95;">
          ${name || "Current location"}
        </div>
        <div style="font-size: 11px; margin-top: 8px; opacity: 0.8; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);">
          📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </div>
      </div>
    `;

    // Create new popup
    popupRef.current = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      className: 'nasa-popup'
    })
      .setLngLat([lng, lat])
      .setHTML(popupContent)
      .addTo(mapRef.current);

  }, [reverseGeocode]);

  useEffect(() => {
    mapboxgl.accessToken = token;
    if (!mapboxgl.accessToken) {
      console.error("Missing REACT_APP_MAPBOX_ACCESS_TOKEN");
      setLoading(false);
      return;
    }
    if (typeof mapboxgl.setTelemetry === "function") mapboxgl.setTelemetry(false);

    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [longitude, latitude],
      zoom: 14,
    });
    mapRef.current = map;

    map.on('load', () => {
      setLoading(false);
      
      // Add disaster zone circle
      map.addLayer({
        id: 'disaster-zone',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            }]
          }
        },
        paint: {
          'circle-radius': 100,
          'circle-color': '#FF4538',
          'circle-opacity': 0.2,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FF9500',
          'circle-stroke-opacity': 0.6
        }
      });
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserHeading: true,
    });
    map.addControl(geolocate, "top-right");

    geolocate.on("geolocate", async (e) => {
      const pos = e?.coords ? e : e?.position ? e.position : null;
      const coords = pos?.coords;
      if (!coords || coords.latitude == null || coords.longitude == null) {
        console.warn("Geolocate event missing coords", e);
        return;
      }
      const lat = coords.latitude;
      const lng = coords.longitude;
      map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
      await setMarkerWithName(lng, lat);
    });

    geolocate.on("error", (err) => {
      console.warn("Geolocate error", err);
    });

    setMarkerWithName(longitude, latitude);

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, token, setMarkerWithName]);

  const containerStyle = {
    background: "rgba(15, 20, 40, 0.8)",
    backdropFilter: "blur(15px)",
    borderRadius: "18px",
    padding: "25px",
    border: "2px solid rgba(255, 149, 0, 0.3)",
    boxShadow: "0 8px 32px rgba(255, 69, 58, 0.2)",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "15px",
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#FF4538",
    margin: 0,
    textShadow: "0 0 15px rgba(255, 69, 58, 0.5)",
  };

  const subtitleStyle = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.7)",
    margin: "5px 0 0 0",
  };

  const placeStyle = {
    fontSize: "0.85rem",
    color: "#FF9500",
    margin: "5px 0 15px 0",
    padding: "8px 12px",
    background: "rgba(255, 149, 0, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 149, 0, 0.3)",
  };

  const mapContainerStyle = {
    height: "400px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "2px solid rgba(255, 69, 58, 0.3)",
    boxShadow: "0 4px 20px rgba(255, 69, 58, 0.3)",
    position: "relative",
  };

  const loadingOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(10, 14, 39, 0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: "12px",
  };

  return (
    <>
      <style>
        {`
          .mapboxgl-popup-content {
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          
          .mapboxgl-popup-close-button {
            color: white !important;
            font-size: 20px !important;
            padding: 5px 10px !important;
            right: 5px !important;
            top: 5px !important;
          }
          
          .mapboxgl-popup-close-button:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            border-radius: 50%;
          }
          
          .mapboxgl-popup-tip {
            display: none !important;
          }

          .mapboxgl-ctrl-group {
            background: rgba(15, 20, 40, 0.9) !important;
            border: 1px solid rgba(255, 149, 0, 0.3) !important;
            border-radius: 8px !important;
          }

          .mapboxgl-ctrl-group button {
            background: transparent !important;
            border-bottom: 1px solid rgba(255, 149, 0, 0.2) !important;
          }

          .mapboxgl-ctrl-group button:hover {
            background: rgba(255, 69, 58, 0.2) !important;
          }

          .mapboxgl-ctrl-icon {
            filter: brightness(0) invert(1) !important;
          }
        `}
      </style>

      <motion.div
        style={containerStyle}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div style={headerStyle}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: "2rem" }}
          >
            🗺️
          </motion.div>
          <div>
            <h3 style={titleStyle}>{title || "Location Map"}</h3>
            <p style={subtitleStyle}>{subtitle}</p>
          </div>
        </div>

        {place && (
          <motion.div
            style={placeStyle}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            📍 <strong>{place}</strong>
          </motion.div>
        )}

        <div style={mapContainerStyle}>
          <div ref={ref} style={{ height: "100%", width: "100%" }} />
          
          {loading && (
            <motion.div
              style={loadingOverlayStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ fontSize: "3rem", marginBottom: "15px" }}
              >
                🛰️
              </motion.div>
              <p style={{ color: "#FF9500", fontSize: "1.1rem", fontWeight: "600" }}>
                Loading NASA Satellite Map...
              </p>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "rgba(255, 149, 0, 0.1)",
            borderRadius: "10px",
            border: "1px solid rgba(255, 149, 0, 0.3)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.85rem", margin: 0 }}>
            🛰️ <strong>Disaster Monitoring Zone</strong> • Real-time location tracking enabled
          </p>
        </motion.div>
      </motion.div>
    </>
  );
}

export default MapView;
