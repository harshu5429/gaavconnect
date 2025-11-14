/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate distance matrix for multiple points
 */
export function calculateDistanceMatrix(
  coordinates: Array<{ lat: number; lng: number }>
): number[][] {
  const n = coordinates.length;
  const matrix: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(
          coordinates[i].lat,
          coordinates[i].lng,
          coordinates[j].lat,
          coordinates[j].lng
        );
      }
    }
  }

  return matrix;
}

/**
 * Estimate travel time based on distance and transport mode
 * Returns time in minutes
 */
export function estimateTravelTime(
  distance: number,
  mode: 'walk' | 'bus' | 'auto' | 'bike'
): number {
  // Average speeds in km/h for different modes
  const speeds: Record<string, number> = {
    walk: 4,
    bike: 15,
    auto: 35,
    bus: 30,
  };

  const speed = speeds[mode] || 20;
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  // Add 5 minute buffer for stops/traffic
  return timeInMinutes + 5;
}

/**
 * Calculate fare based on distance and transport mode
 * Returns fare in rupees
 */
export function calculateFare(
  distance: number,
  mode: 'walk' | 'bus' | 'auto' | 'bike'
): number {
  const fares: Record<string, { base: number; perKm: number }> = {
    walk: { base: 0, perKm: 0 },
    bike: { base: 10, perKm: 5 },
    auto: { base: 20, perKm: 8 },
    bus: { base: 15, perKm: 3 },
  };

  const fareConfig = fares[mode] || fares.auto;
  const totalFare = fareConfig.base + distance * fareConfig.perKm;
  
  return Math.round(totalFare);
}

/**
 * Get reliability score for a transport mode
 * Returns score 0-100
 */
export function getReliabilityScore(mode: 'walk' | 'bus' | 'auto' | 'bike'): number {
  const scores: Record<string, number> = {
    walk: 95,
    bike: 85,
    auto: 75,
    bus: 70,
  };
  
  return scores[mode] || 75;
}
