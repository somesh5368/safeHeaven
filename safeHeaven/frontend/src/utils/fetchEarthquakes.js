// src/utils/fetchEarthquakes.js

import axios from 'axios';

export async function fetchEarthquakes({ lat, lon, hours = 48, radiusKm = 500, minmag = 3.0 }) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 3600 * 1000);

  const params = {
    format: 'geojson',
    starttime: start.toISOString(),
    endtime: end.toISOString(),
    latitude: lat,
    longitude: lon,
    maxradiuskm: radiusKm,
    minmagnitude: minmag,
    orderby: 'time',
    limit: 50
  };

  try {
    const { data } = await axios.get('/usgs/fdsnws/event/1/query', {
      params,
      timeout: 15000
    });
    const feats = Array.isArray(data?.features) ? data.features : [];
    return feats.map(f => ({
      id: f.id,
      mag: f.properties?.mag ?? null,
      place: f.properties?.place ?? '',
      time: f.properties?.time ?? null,
      url: f.properties?.url ?? '',
      coords: f.geometry?.coordinates
        ? { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], depth: f.geometry.coordinates[2] }
        : null
    }));
  } catch (err) {
    // Surface response details in the console
    // eslint-disable-next-line no-console
    console.error('USGS fetch error', err?.response?.status, err?.response?.data || err?.message);
    throw err;
  }
}
