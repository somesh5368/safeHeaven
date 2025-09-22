import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState, useCallback } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

function MapView({ latitude, longitude, title, subtitle }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const [place, setPlace] = useState("");

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

    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker();
    }
    markerRef.current.setLngLat([lng, lat]).addTo(mapRef.current);

    const name = await reverseGeocode(lng, lat);
    setPlace(name);

    if (!popupRef.current) {
      popupRef.current = new mapboxgl.Popup({ offset: 12 });
    }
    popupRef.current
      .setLngLat([lng, lat])
      .setHTML(`<div style="font-size:12px;line-height:1.3">${name || "Current location"}</div>`)
      .addTo(mapRef.current);
  }, [reverseGeocode]);

  useEffect(() => {
    mapboxgl.accessToken = token;
    if (!mapboxgl.accessToken) { console.error("Missing REACT_APP_MAPBOX_ACCESS_TOKEN"); return; }
    if (typeof mapboxgl.setTelemetry === "function") mapboxgl.setTelemetry(false);

    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 14
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserHeading: true
    });
    map.addControl(geolocate, "top-right");

    geolocate.on("geolocate", async (e) => {
      const pos = e?.coords ? e : (e?.position ? e.position : null);
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
      popupRef.current && popupRef.current.remove();
      markerRef.current && markerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, token, setMarkerWithName]);

  return (
    <div>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {subtitle}{place ? ` • ${place}` : ""}
      </div>
      <div ref={ref} style={{ height: 380, borderRadius: 8, marginTop: 8 }} />
    </div>
  );
}

export default MapView;
