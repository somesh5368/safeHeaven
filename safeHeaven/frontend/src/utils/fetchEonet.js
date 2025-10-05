// src/utils/fetchEonet.js
const EONET_GEOJSON = "https://eonet.gsfc.nasa.gov/api/v3/events/geojson";

export async function fetchEonetGeoJSON({
  category = "",
  status = "open",
  days = 14,
  limit = 200,
  bbox = "",
  start = "",
  end = ""
} = {}) {
  const qp = new URLSearchParams();
  if (category) qp.set("category", category);
  if (status) qp.set("status", status);
  if (days) qp.set("days", String(days));
  if (limit) qp.set("limit", String(limit));
  if (bbox) qp.set("bbox", bbox);
  if (start) qp.set("start", start);
  if (end) qp.set("end", end);

  const url = `${EONET_GEOJSON}?${qp.toString()}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`EONET ${r.status}`);
  return await r.json();
}
