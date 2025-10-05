// src/utils/fetchWeather.js
export const fetchWeather = async (latitude, longitude) => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 1);
  const end = endDate.toISOString().slice(0,10).replace(/-/g, "");
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 4);
  const start = startDate.toISOString().slice(0,10).replace(/-/g, "");

  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR&community=AG&start=${start}&end=${end}&latitude=${latitude}&longitude=${longitude}&format=JSON`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('POWER fetch error status', res.status);
      throw new Error(`POWER error ${res.status}`);
    }
    const json = await res.json();
    const p = json?.properties?.parameter || {};
    const fix = v => (v === -999 || v === -999.0 ? null : v);

    const keys = p?.T2M ? Object.keys(p.T2M)
              : p?.RH2M ? Object.keys(p.RH2M)
              : p?.PRECTOTCORR ? Object.keys(p.PRECTOTCORR)
              : [];
    keys.sort();

    return keys.map(date => ({
      date,
      temperature: p?.T2M ? fix(p.T2M[date]) : null,
      humidity:    p?.RH2M ? fix(p.RH2M[date]) : null,
      rain:        p?.PRECTOTCORR ? fix(p.PRECTOTCORR[date]) : null
    }));
  } catch (e) {
    console.error('POWER fetch exception', e);
    throw e;
  }
};
