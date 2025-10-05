export const pickMostRecentAvailable = (series, fields = ["rain","humidity","temp"]) => {
  for (let i = series.length - 1; i >= 0; i--) {
    const row = series[i] || {};

    const ok = fields.some(f => row[f] != null && Number.isFinite(Number(row[f])));
    if (ok) return row;
    
  }
  return series[series.length - 1] || null;
};
