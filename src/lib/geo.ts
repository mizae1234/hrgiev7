/**
 * Geolocation calculations and radius validation
 * Uses the Haversine formula to compute great-circle distance between two GPS points in meters.
 */

const EARTH_RADIUS_METERS = 6371000;

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates distance between two GPS coordinates in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10;
}

/**
 * Validates if the user's location is within the allowed radius of the work location.
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  allowedRadiusMeters: number
): { isWithin: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceMeters(userLat, userLon, targetLat, targetLon);
  return {
    isWithin: distanceMeters <= allowedRadiusMeters,
    distanceMeters,
  };
}

/**
 * Friendly distance formatting (e.g. "45 ม." or "1.2 กม.")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} เมตร`;
  }
  return `${(meters / 1000).toFixed(2)} กิโลเมตร`;
}
