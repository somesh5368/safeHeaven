export async function fetchTsunamiAlerts() {
  try {
    const res = await fetch('/nws/alerts/active?event=Tsunami', {
      headers: {
        'User-Agent': 'SafeHeaven/1.0 (https://safeheaven.local; [email protected])',
        'Accept': 'application/geo+json'
      }
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      
      console.error('NWS fetch error status', res.status);
      throw new Error(`NWS ${res.status}`);
    }
    const json = await res.json();
    return Array.isArray(json?.features) ? json.features : [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('NWS fetch exception', e);
    throw e;
  }
}
