// src/utils/fetchWeather.js
export const fetchWeather = async (latitude, longitude) => {
  // yesterday to avoid incomplete daily aggregates
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 1);
  const end = endDate.toISOString().split("T")[0].replace(/-/g, "");
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 4);
  const start = startDate.toISOString().split("T")[0].replace(/-/g, "");

  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR&community=AG&start=${start}&end=${end}&latitude=${latitude}&longitude=${longitude}&format=JSON`;
  const res = await fetch(url);
  const data = await res.json();
  const params = data?.properties?.parameter;

  if (params?.T2M) {
    return Object.keys(params.T2M).map((date) => ({
      date,
      temperature: params.T2M[date],
      humidity: params.RH2M[date],
      rain: params.PRECTOTCORR[date],
    }));
  }
  return [];
};
