// src/utils/hazardRules.js

// TOGGLE: Set true to verify alerts with lenient thresholds, then false for production
const TEST_MODE = true; // ⚠️ Change to false after confirming alerts work

const hav = (a, b) => {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat/2)**2 +
            Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// Ray-casting point-in-polygon check (lon,lat ring)
const pointInPoly = (point, ring) => {
  const x = point.lon, y = point.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const norm = (f) => {
  const p = f?.properties || {};
  const category = p?.categories?.[0]?.title || p?.category || "Event";
  const title = p?.title || p?.id || "Event";
  const updated = p?.geometryDates?.length ? p.geometryDates[p.geometryDates.length - 1] : (p?.date || "");
  const mag = Number(p?.magnitudeValue ?? 0);
  return { category, title, updated, mag };
};

const mapType = (cat) => {
  const c = (cat || "").toLowerCase();
  if (c.includes("earthquake")) return "earthquake";
  if (c.includes("storm")) return "cyclone";
  if (c.includes("volcano")) return "cyclone";
  if (c.includes("fire")) return "flood";
  if (c.includes("flood")) return "flood";
  return "flood";
};

export function evaluateHazards({ coords, eonetFeatures }) {
  let best = { type: null, level: "neutral", reason: null, updatedAt: null };
  const pr = (lvl) => ({ neutral: 0, warning: 1, critical: 2 })[lvl] ?? 0;

  // Thresholds (km, magnitude). TEST_MODE loosens to prove pipeline works.
  const EQ_WARN_DIST = TEST_MODE ? 300 : 100;
  const EQ_CRIT_DIST = TEST_MODE ? 150 : 50;
  const EQ_CRIT_MAG  = TEST_MODE ? 4.5 : 5.5;

  const HAZ_WARN_DIST = TEST_MODE ? 200 : 100;
  const HAZ_CRIT_DIST = TEST_MODE ? 80  : 25;
  const VOLC_WARN_DIST = TEST_MODE ? 100 : 50;

  (eonetFeatures || []).forEach(f => {
    const { category, title, updated, mag } = norm(f);
    let level = "neutral";

    if (f.geometry?.type === "Point") {
      const [lon, lat] = f.geometry.coordinates || [];
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const d = hav({ lat: coords.latitude, lon: coords.longitude }, { lat, lon });
        if (category === "Earthquakes") {
          if (mag >= EQ_CRIT_MAG && d <= EQ_CRIT_DIST) level = "critical";
          else if (d <= EQ_WARN_DIST) level = "warning";
        } else if (category === "Volcanoes") {
          if (d <= VOLC_WARN_DIST) level = "warning";
        } else if (category === "Severe Storms" || category === "Floods" || category === "Wildfires") {
          if (d <= HAZ_CRIT_DIST) level = "critical";
          else if (d <= HAZ_WARN_DIST) level = "warning";
        }
      }
    } else if (f.geometry?.type === "Polygon") {
      const ring = f.geometry.coordinates?.[0] || [];
      if (ring.length) {
        // Check containment first: inside polygon => critical
        const inside = pointInPoly(
          { lon: coords.longitude, lat: coords.latitude },
          ring
        );
        if (inside && (category === "Wildfires" || category === "Floods" || category === "Severe Storms")) {
          level = "critical";
        } else {
          // Fallback to centroid distance
          const avg = ring.reduce(
            (acc, [x, y]) => ({ lat: acc.lat + y, lon: acc.lon + x }),
            { lat: 0, lon: 0 }
          );
          avg.lat /= ring.length; avg.lon /= ring.length;
          const d = hav({ lat: coords.latitude, lon: coords.longitude }, { lat: avg.lat, lon: avg.lon });
          if (category === "Wildfires" || category === "Floods" || category === "Severe Storms") {
            if (d <= HAZ_CRIT_DIST) level = "critical";
            else if (d <= HAZ_WARN_DIST) level = "warning";
          } else if (category === "Volcanoes") {
            if (d <= VOLC_WARN_DIST) level = "warning";
          }
        }
      }
    }

    if (pr(level) > pr(best.level)) {
      best = {
        type: mapType(category),
        level,
        reason: `${category}: ${title}`,
        updatedAt: updated
      };
    }
  });

  // Optional force-trigger if TEST_MODE and any events present (for pipeline verify)
  if (best.level === "neutral" && TEST_MODE && (eonetFeatures?.length || 0) > 0) {
    best = { type: "flood", level: "warning", reason: "TEST_MODE: first nearby event", updatedAt: new Date().toISOString() };
  }

  return best;
}
