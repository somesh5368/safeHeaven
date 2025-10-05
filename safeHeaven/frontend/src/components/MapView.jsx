// src/components/MapView.jsx
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchEonetGeoJSON } from "../utils/fetchEonet";

function MapView({
  latitude,
  longitude,
  title,
  subtitle,
  eonetCategory,
  eonetStatus = "open",
  eonetDays = 14,
  eonetLimit = 200,
  autoRefreshSec = 180
}) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const refreshRef = useRef(null);

  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(true);
  const [eonetLoading, setEonetLoading] = useState(false);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  const EONET_SRC_ID = "eonet-events";
  const EONET_PTS_LAYER_ID = "eonet-events-points";
  const EONET_FILL_LAYER_ID = "eonet-events-polygons";
  const EONET_LINE_LAYER_ID = "eonet-events-polygons-outline";

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

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    const el = document.createElement('div');
    el.innerHTML = '📍';
    el.style.fontSize = '32px';
    el.style.cursor = 'pointer';
    el.style.filter = 'drop-shadow(0 0 8px rgba(255, 69, 58, 0.8))';

    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    const name = await reverseGeocode(lng, lat);
    setPlace(name);

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    const popupContent = `
      <div style="background: linear-gradient(135deg, rgba(255, 69, 58, 0.95), rgba(255, 107, 53, 0.95));
                  padding: 15px; border-radius: 10px; color: white; font-family: 'Segoe UI', Arial, sans-serif;
                  min-width: 200px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛰️ Monitoring Location</div>
        <div style="font-size: 13px; line-height: 1.6; opacity: 0.95;">${name || "Current location"}</div>
        <div style="font-size: 11px; margin-top: 8px; opacity: 0.8; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);">
          📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </div>
      </div>
    `;
    popupRef.current = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false, className: 'nasa-popup' })
      .setLngLat([lng, lat])
      .setHTML(popupContent)
      .addTo(mapRef.current);
  }, [reverseGeocode]);

  const loadEonetOnce = useCallback(async () => {
    if (!mapRef.current) return;
    try {
      setEonetLoading(true);
      const geo = await fetchEonetGeoJSON({
        category: eonetCategory || "",
        status: eonetStatus,
        days: eonetDays,
        limit: eonetLimit
      });
      if (geo && Array.isArray(geo.features)) {
        geo.features.forEach(f => {
          const p = f.properties || {};
          const cat = p?.categories?.[0]?.title || p?.category || "Event";
          const mag = Number(p?.magnitudeValue ?? 0);
          const lastDate = p?.geometryDates?.length ? p.geometryDates[p.geometryDates.length - 1] : (p?.date || "");
          const title = p?.title || p?.id || "Event";
          const link = p?.link || (Array.isArray(p?.sources) ? p.sources[0]?.url : "") || "";
          f.properties = {
            ...p,
            title,
            link,
            category: cat,
            magnitudeValue: Number.isFinite(mag) ? mag : 0,
            geometryDate: lastDate
          };
        });
      }
      const map = mapRef.current;
      const src = map.getSource(EONET_SRC_ID);
      if (src) src.setData(geo);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("EONET fetch error", e);
    } finally {
      setTimeout(() => setEonetLoading(false), 100);
    }
  }, [eonetCategory, eonetStatus, eonetDays, eonetLimit]);

  const startEonetAutoRefresh = useCallback(() => {
    const sec = Math.max(30, Number(autoRefreshSec) || 180);
    if (refreshRef.current) clearInterval(refreshRef.current);
    refreshRef.current = setInterval(() => {
      loadEonetOnce();
    }, sec * 1000);
  }, [autoRefreshSec, loadEonetOnce]);

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

      map.addSource('disaster-zone-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] } }]
        }
      });
      map.addLayer({
        id: 'disaster-zone',
        type: 'circle',
        source: 'disaster-zone-src',
        paint: {
          'circle-radius': 100,
          'circle-color': '#FF4538',
          'circle-opacity': 0.2,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FF9500',
          'circle-stroke-opacity': 0.6
        }
      });

      if (!map.getSource(EONET_SRC_ID)) {
        map.addSource(EONET_SRC_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }

      if (!map.getLayer(EONET_FILL_LAYER_ID)) {
        map.addLayer({
          id: EONET_FILL_LAYER_ID,
          type: 'fill',
          source: EONET_SRC_ID,
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: {
            'fill-color': [
              'match',
              ['get', 'category'],
              'Wildfires', '#FF6B00',
              'Severe Storms', '#FFD60A',
              'Volcanoes', '#FF4538',
              'Earthquakes', '#FF3B30',
              'Floods', '#1E90FF',
              'Icebergs', '#34C759',
              /* other */ '#FFA500'
            ],
            'fill-opacity': 0.25
          }
        });
      }

      if (!map.getLayer(EONET_LINE_LAYER_ID)) {
        map.addLayer({
          id: EONET_LINE_LAYER_ID,
          type: 'line',
          source: EONET_SRC_ID,
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: { 'line-color': '#ffffff', 'line-width': 1 }
        });
      }

      if (!map.getLayer(EONET_PTS_LAYER_ID)) {
        map.addLayer({
          id: EONET_PTS_LAYER_ID,
          type: 'circle',
          source: EONET_SRC_ID,
          filter: ['==', ['geometry-type'], 'Point'],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['get', 'magnitudeValue'], 0, 4, 10, 10],
            'circle-color': [
              'match',
              ['get', 'category'],
              'Wildfires', '#FF6B00',
              'Severe Storms', '#FFD60A',
              'Volcanoes', '#FF4538',
              'Earthquakes', '#FF3B30',
              'Floods', '#1E90FF',
              'Icebergs', '#34C759',
              /* other */ '#FFA500'
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.9
          }
        });
      }

      loadEonetOnce();
      startEonetAutoRefresh();
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
      if (!coords || coords.latitude == null || coords.longitude == null) return;
      const lat = coords.latitude, lng = coords.longitude;
      map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
      await setMarkerWithName(lng, lat);
    });

    const onClick = (e) => {
      const layers = [EONET_PTS_LAYER_ID, EONET_FILL_LAYER_ID];
      const feats = map.queryRenderedFeatures(e.point, { layers });
      if (!feats.length) return;
      const f = feats[0];
      const p = f.properties || {};
      const eventTitle = p.title ?? "Event";
      const catTxt = p.category ?? "";
      const link = p.link ?? "";
      const updated = p.geometryDate ?? p.date ?? "";

      const html = `
        <div style="background: linear-gradient(135deg, rgba(15,20,40,0.95), rgba(255,149,0,0.25));
                    padding: 12px; border-radius: 10px; color: white; font-family: 'Segoe UI', Arial, sans-serif;
                    min-width: 220px;">
          <div style="font-weight:700; margin-bottom:6px;">${eventTitle}</div>
          <div style="font-size:12px; opacity:0.9;">${catTxt}</div>
          <div style="font-size:11px; margin-top:6px; opacity:0.8;">Updated: ${updated}</div>
          ${link ? `<div style="margin-top:8px;"><a href="${link}" target="_blank" rel="noopener" style="color:#FFD60A;">Details</a></div>` : ""}
        </div>
      `;
      new mapboxgl.Popup({ offset: 12 }).setLngLat(e.lngLat).setHTML(html).addTo(map);
    };

    map.on('click', EONET_PTS_LAYER_ID, onClick);
    map.on('click', EONET_FILL_LAYER_ID, onClick);
    map.on('mouseenter', EONET_PTS_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', EONET_PTS_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });

    setMarkerWithName(longitude, latitude);

    return () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (refreshRef.current) { clearInterval(refreshRef.current); refreshRef.current = null; }
      if (mapRef.current) {
        const m = mapRef.current;
        if (m.getLayer(EONET_PTS_LAYER_ID)) m.removeLayer(EONET_PTS_LAYER_ID);
        if (m.getLayer(EONET_FILL_LAYER_ID)) m.removeLayer(EONET_FILL_LAYER_ID);
        if (m.getLayer(EONET_LINE_LAYER_ID)) m.removeLayer(EONET_LINE_LAYER_ID);
        if (m.getLayer('disaster-zone')) m.removeLayer('disaster-zone');
        if (m.getSource(EONET_SRC_ID)) m.removeSource(EONET_SRC_ID);
        if (m.getSource('disaster-zone-src')) m.removeSource('disaster-zone-src');
        m.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, token, setMarkerWithName, loadEonetOnce, startEonetAutoRefresh]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    m.flyTo({ center: [longitude, latitude], zoom: Math.max(m.getZoom(), 12), essential: true });
    const src = m.getSource('disaster-zone-src');
    if (src && 'setData' in src) {
      src.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] } }]
      });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      loadEonetOnce();
      startEonetAutoRefresh();
    }
  }, [eonetCategory, eonetStatus, eonetDays, eonetLimit, autoRefreshSec, loadEonetOnce, startEonetAutoRefresh]);

  const containerStyle = { background: "rgba(15, 20, 40, 0.8)", backdropFilter: "blur(15px)", borderRadius: "18px", padding: "25px", border: "2px solid rgba(255, 149, 0, 0.3)", boxShadow: "0 8px 32px rgba(255, 69, 58, 0.2)" };
  const headerStyle = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" };
  const titleStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#FF4538", margin: 0, textShadow: "0 0 15px rgba(255, 69, 58, 0.5)" };
  const subtitleStyle = { fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.7)", margin: "5px 0 0 0" };
  const placeStyle = { fontSize: "0.85rem", color: "#FF9500", margin: "5px 0 15px 0", padding: "8px 12px", background: "rgba(255, 149, 0, 0.1)", borderRadius: "8px", border: "1px solid rgba(255, 149, 0, 0.3)" };
  const mapContainerStyle = { height: "500px", borderRadius: "12px", overflow: "hidden", border: "2px solid rgba(255, 69, 58, 0.3)", boxShadow: "0 4px 20px rgba(255, 69, 58, 0.3)", position: "relative" };
  const loadingOverlayStyle = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10, 14, 39, 0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: "12px" };

  return (
    <>
      <style>{`
        .mapboxgl-popup-content { padding: 0 !important; background: transparent !important; box-shadow: none !important; }
        .mapboxgl-popup-close-button { color: white !important; font-size: 20px !important; padding: 5px 10px !important; right: 5px !important; top: 5px !important; }
        .mapboxgl-popup-close-button:hover { background: rgba(255, 255, 255, 0.2) !important; border-radius: 50%; }
        .mapboxgl-popup-tip { display: none !important; }
        .mapboxgl-ctrl-group { background: rgba(15, 20, 40, 0.9) !important; border: 1px solid rgba(255, 149, 0, 0.3) !important; border-radius: 8px !important; }
        .mapboxgl-ctrl-group button { background: transparent !important; border-bottom: 1px solid rgba(255, 149, 0, 0.2) !important; }
        .mapboxgl-ctrl-group button:hover { background: rgba(255, 69, 58, 0.2) !important; }
        .mapboxgl-ctrl-icon { filter: brightness(0) invert(1) !important; }
      `}</style>

      <motion.div style={containerStyle} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div style={headerStyle}>
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: "2rem" }}>🗺️</motion.div>
          <div>
            <h3 style={titleStyle}>{title || "Location Map"}</h3>
            <p style={subtitleStyle}>{subtitle}</p>
          </div>
        </div>

        {place && (
          <motion.div style={placeStyle} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            📍 <strong>{place}</strong>
          </motion.div>
        )}

        <div style={mapContainerStyle}>
          <div ref={ref} style={{ height: "100%", width: "100%" }} />
          {(loading || eonetLoading) && (
            <motion.div style={loadingOverlayStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ fontSize: "3rem", marginBottom: "15px" }}>🛰️</motion.div>
              <p style={{ color: "#FF9500", fontSize: "1.1rem", fontWeight: "600" }}>Loading NASA Events...</p>
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: "15px", padding: "12px", background: "rgba(255, 149, 0, 0.1)", borderRadius: "10px", border: "1px solid rgba(255, 149, 0, 0.3)", textAlign: "center" }}>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.85rem", margin: 0 }}>
            🛰️ <strong>Disaster Monitoring Zone</strong> • Real-time EONET events overlay
          </p>
        </motion.div>
      </motion.div>
    </>
  );
}

export default MapView;
