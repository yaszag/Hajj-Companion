const EARTH_RADIUS_M = 6371000;

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
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

export function etaMinutes(distanceM: number): number {
  const walkingSpeedMs = 1.1;
  return Math.ceil(distanceM / walkingSpeedMs / 60);
}
