/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * @returns Distance in kilometers, or null if coordinates are invalid
 */
export function getDistanceInKm(
  aLat: number | null | undefined,
  aLng: number | null | undefined,
  bLat: number | null | undefined,
  bLng: number | null | undefined
): number | null {
  // Validate inputs
  if (
    aLat == null || aLng == null || bLat == null || bLng == null ||
    isNaN(aLat) || isNaN(aLng) || isNaN(bLat) || isNaN(bLng)
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) {
    return 'Distance unavailable';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm} km`;
}
