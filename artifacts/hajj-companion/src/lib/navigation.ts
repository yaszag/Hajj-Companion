export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const toDeg = (angle: number) => (angle * 180) / Math.PI;
  
  const dLng = toRad(lng2 - lng1);
  
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
            
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

export function bearingToArabic(bearing: number): string {
  const directions = [
    { label: "شمالاً ↑", min: 337.5, max: 360 },
    { label: "شمالاً ↑", min: 0, max: 22.5 },
    { label: "شمال شرق ↗", min: 22.5, max: 67.5 },
    { label: "شرقاً →", min: 67.5, max: 112.5 },
    { label: "جنوب شرق ↘", min: 112.5, max: 157.5 },
    { label: "جنوباً ↓", min: 157.5, max: 202.5 },
    { label: "جنوب غرب ↙", min: 202.5, max: 247.5 },
    { label: "غرباً ←", min: 247.5, max: 292.5 },
    { label: "شمال غرب ↖", min: 292.5, max: 337.5 },
  ];
  
  for (const dir of directions) {
    if (bearing >= dir.min && bearing < dir.max) {
      return `اتجه ${dir.label}`;
    }
  }
  
  return "اتجه شمالاً ↑";
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} كم`;
  }
  return `${Math.round(meters)} م`;
}

export function etaMinutes(distanceM: number): number {
  const speedMPS = 1.1; // Average walking speed: 1.1 meters per second
  const seconds = distanceM / speedMPS;
  return Math.ceil(seconds / 60);
}
