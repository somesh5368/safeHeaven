// src/components/mapBoxMap.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, Popup } from "react-map-gl";
import mapboxgl from "mapbox-gl";

try { mapboxgl.setTelemetryEnabled?.(false); } catch {}

const TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

export default function MapboxMap({
  center = { longitude: 77.5946, latitude: 12.9716 },
  markerCoords = null,
  zoom = 11,
  height = "60vh"
}) {
  const mapRef = useRef(null);

  // Controlled view state so camera updates when props change
  const [viewState, setViewState] = useState({
    longitude: center.longitude,
    latitude: center.latitude,
    zoom
  });

  // Update camera when live coords arrive
  useEffect(() => {
    const nextLon = markerCoords?.longitude ?? center.longitude;
    const nextLat = markerCoords?.latitude ?? center.latitude;
    const nextZoom = markerCoords ? Math.max(13, zoom) : zoom;

    setViewState((v) => ({ ...v, longitude: nextLon, latitude: nextLat, zoom: nextZoom }));

    // Smooth camera transition if map instance ready
    if (mapRef.current) {
      try {
        mapRef.current.flyTo({ center: [nextLon, nextLat], zoom: nextZoom, essential: true });
      } catch {}
    }
  }, [markerCoords, center.longitude, center.latitude, zoom]); // recenter on coords change [4][9]

  const [showPopup, setShowPopup] = useState(false);
  const [placeName, setPlaceName] = useState("");

  const markerLon = useMemo(() => markerCoords?.longitude ?? center.longitude, [markerCoords, center.longitude]);
  const markerLat = useMemo(() => markerCoords?.latitude ?? center.latitude, [markerCoords, center.latitude]);

  const fetchPlaceName = async (lng, lat) => {
    if (!TOKEN) {
      setPlaceName("Missing Mapbox token");
      return;
    }
    try {
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi,place,locality,neighborhood,address&limit=1&access_token=${TOKEN}`
      );
      const data = await resp.json();
      const name =
        Array.isArray(data?.features) && data.features.length > 0
          ? data.features.place_name
          : "Unknown place";
      setPlaceName(String(name));
    } catch {
      setPlaceName("Unknown place");
    }
  }; // read features.place_name per spec [19][20]

  // When position changes, fetch name and show popup
  useEffect(() => {
    if (markerLon != null && markerLat != null) {
      fetchPlaceName(markerLon, markerLat);
      setShowPopup(true);
    }
  }, [markerLon, markerLat]); // update popup on geolocation [4]

  return (
    <div style={{ width: "100%", height, borderRadius: 12, overflow: "hidden" }}>
      <Map
        ref={mapRef}
        mapLib={mapboxgl}
        mapboxAccessToken={TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: "100%", height: "100%" }}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={async (e) => {
          const { lng, lat } = e.lngLat;
          await fetchPlaceName(lng, lat);
          setShowPopup(true);
        }}
        onStyleImageMissing={(e) => {
          const map = e.target;
          map.loadImage("/fallback-marker.png", (err, img) => {
            if (!err && img && !map.hasImage(e.id)) {
              map.addImage(e.id, img);
            }
          });
        }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-left" trackUserLocation showUserHeading />

        <Marker
          longitude={markerLon}
          latitude={markerLat}
          color="red"
          onClick={async (e) => {
            e.originalEvent.stopPropagation();
            await fetchPlaceName(markerLon, markerLat);
            setShowPopup(true);
          }}
        />

        {showPopup && (
          <Popup
            longitude={markerLon}
            latitude={markerLat}
            anchor="top"
            closeOnClick={false}
            onClose={() => setShowPopup(false)}
            offset={10}
          >
            <div style={{ maxWidth: 260 }}>
              <strong>Location</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>{placeName}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {markerLat?.toFixed(6)}, {markerLon?.toFixed(6)}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
