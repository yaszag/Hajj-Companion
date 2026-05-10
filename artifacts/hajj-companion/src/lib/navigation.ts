export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Correct bearing formula: atan2(y, x) — north=0, clockwise positive
export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (a: number) => (a * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function bearingToArabic(bearing: number): string {
  if (bearing < 22.5 || bearing >= 337.5) return "اتجه شمالاً ↑";
  if (bearing < 67.5) return "اتجه شمال شرقاً ↗";
  if (bearing < 112.5) return "اتجه شرقاً →";
  if (bearing < 157.5) return "اتجه جنوب شرقاً ↘";
  if (bearing < 202.5) return "اتجه جنوباً ↓";
  if (bearing < 247.5) return "اتجه جنوب غرباً ↙";
  if (bearing < 292.5) return "اتجه غرباً ←";
  return "اتجه شمال غرباً ↖";
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} كم`;
  return `${Math.round(meters)} م`;
}

// Hajj-adjusted speed: 0.8 m/s (crowds + elderly)
export function etaMinutes(distanceM: number): number {
  return Math.ceil(distanceM / 0.8 / 60);
}

export function etaRange(distanceM: number): string {
  const low = Math.floor(distanceM / 0.9 / 60);
  const high = Math.ceil(distanceM / 0.6 / 60);
  if (low === 0 && high <= 1) return "أقل من دقيقة";
  if (low === high) return `~${low} دقيقة`;
  return `${low} - ${high} دقيقة`;
}
