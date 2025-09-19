// src/components/MapView.jsx
import React from "react";
import Map, { Marker, NavigationControl, ScaleControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapContainer from "./MapContainer";

const MapView = ({ latitude, longitude, title = "Current Location", subtitle = "" }) => {
  if (latitude == null || longitude == null) return null;

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return (
      <MapContainer title={title} subtitle={subtitle}>
        <div style={{ padding: 16, color: "#b91c1c" }}>
          Map token missing. Set REACT_APP_MAPBOX_ACCESS_TOKEN and restart dev server.
        </div>
      </MapContainer>
    );
  }

  return (
    <MapContainer title={title} subtitle={subtitle}>
      <div style={{ width: "100%", height: "420px" }}>
        <Map
          mapboxAccessToken={token}
          initialViewState={{ longitude, latitude, zoom: 12 }}
          viewState={{ longitude, latitude, zoom: 12 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          <Marker longitude={longitude} latitude={latitude} color="red" />
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <NavigationControl visualizePitch />
          </div>
          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <ScaleControl maxWidth={120} unit="metric" />
          </div>
        </Map>
      </div>
    </MapContainer>
  );
};

export default MapView;
