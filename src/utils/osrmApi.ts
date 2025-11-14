// OSRM (Open Source Routing Machine) API integration
// Documentation: http://project-osrm.org/docs/v5.24.0/api/

export interface OSRMCoordinate {
  lat: number;
  lng: number;
}

export interface OSRMWaypoint {
  hint: string;
  distance: number;
  name: string;
  location: [number, number]; // [lng, lat]
}

export interface OSRMRoute {
  geometry: string; // Polyline encoded string
  legs: OSRMLeg[];
  distance: number; // in meters
  duration: number; // in seconds
  weight_name: string;
  weight: number;
}

export interface OSRMLeg {
  steps: OSRMStep[];
  distance: number;
  duration: number;
  summary: string;
}

export interface OSRMStep {
  geometry: string;
  maneuver: {
    bearing_after: number;
    bearing_before: number;
    location: [number, number];
    modifier?: string;
    type: string;
  };
  mode: string;
  driving_side: string;
  name: string;
  intersections: any[];
  weight: number;
  duration: number;
  distance: number;
}

export interface OSRMTripResponse {
  code: string;
  waypoints: OSRMWaypoint[];
  trips: OSRMRoute[];
}

export interface OSRMRouteResponse {
  code: string;
  waypoints: OSRMWaypoint[];
  routes: OSRMRoute[];
}

import { osrmConfig, log } from '../config/env';

// Base OSRM API URL from configuration
const OSRM_BASE_URL = osrmConfig.baseUrl;

/**
 * Format coordinates for OSRM API
 * OSRM expects coordinates as "lng,lat;lng,lat;..."
 */
export function formatCoordinatesForOSRM(coordinates: OSRMCoordinate[]): string {
  return coordinates
    .map(coord => `${coord.lng},${coord.lat}`)
    .join(';');
}

/**
 * Get optimized trip route using OSRM Trip API
 * This API solves the Traveling Salesman Problem (TSP)
 */
export async function getOptimizedTrip(
  coordinates: OSRMCoordinate[],
  options: {
    source?: 'first' | 'any';
    destination?: 'last' | 'any';
    roundtrip?: boolean;
    steps?: boolean;
    geometries?: 'polyline' | 'polyline6' | 'geojson';
    overview?: 'full' | 'simplified' | 'false';
  } = {}
): Promise<OSRMTripResponse> {
  if (coordinates.length < 2) {
    throw new Error('At least 2 coordinates are required for trip optimization');
  }

  const coordinateString = formatCoordinatesForOSRM(coordinates);
  
  const params = new URLSearchParams({
    source: options.source || 'first',
    destination: options.destination || 'last',
    roundtrip: options.roundtrip ? 'true' : 'false',
    steps: options.steps ? 'true' : 'false',
    geometries: options.geometries || 'polyline',
    overview: options.overview || 'full'
  });

  const url = `${OSRM_BASE_URL}/trip/v1/driving/${coordinateString}?${params}`;
  
  log('info', '🗺️ OSRM Trip API Request:', url);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data: OSRMTripResponse = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM Trip API error: ${data.code}`);
    }

    log('info', '✅ OSRM Trip API Response:', data);
    return data;
  } catch (error) {
    log('error', '❌ OSRM Trip API Error:', error);
    throw error;
  }
}

/**
 * Get route between two points using OSRM Route API
 */
export async function getRoute(
  start: OSRMCoordinate,
  end: OSRMCoordinate,
  options: {
    steps?: boolean;
    geometries?: 'polyline' | 'polyline6' | 'geojson';
    overview?: 'full' | 'simplified' | 'false';
    alternatives?: boolean;
  } = {}
): Promise<OSRMRouteResponse> {
  const coordinateString = formatCoordinatesForOSRM([start, end]);
  
  const params = new URLSearchParams({
    steps: options.steps ? 'true' : 'false',
    geometries: options.geometries || 'polyline',
    overview: options.overview || 'full',
    alternatives: options.alternatives ? 'true' : 'false'
  });

  const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinateString}?${params}`;
  
  log('info', '🗺️ OSRM Route API Request:', url);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data: OSRMRouteResponse = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM Route API error: ${data.code}`);
    }

    log('info', '✅ OSRM Route API Response:', data);
    return data;
  } catch (error) {
    log('error', '❌ OSRM Route API Error:', error);
    throw error;
  }
}

/**
 * Decode polyline string to coordinates
 * Uses the same algorithm as Google's polyline encoding
 */
export function decodePolyline(encoded: string): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

/**
 * Convert OSRM route to Google Maps compatible format
 */
export function convertOSRMToGoogleMaps(osrmRoute: OSRMRoute) {
  const decodedPath = decodePolyline(osrmRoute.geometry);
  
  return {
    path: decodedPath.map(([lat, lng]) => ({ lat, lng })),
    distance: osrmRoute.distance,
    duration: osrmRoute.duration,
    legs: osrmRoute.legs.map(leg => ({
      distance: leg.distance,
      duration: leg.duration,
      summary: leg.summary,
      steps: leg.steps.map(step => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.name,
        maneuver: step.maneuver.type
      }))
    }))
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get multiple route alternatives using different OSRM options
 */
export async function getRouteAlternatives(coordinates: OSRMCoordinate[]) {
  const alternatives = [];

  try {
    // Option 1: Standard optimization
    const standardTrip = await getOptimizedTrip(coordinates, {
      steps: true,
      overview: 'full',
      roundtrip: false
    });

    if (standardTrip.trips.length > 0) {
      alternatives.push({
        type: 'standard',
        name: 'Fastest Route',
        trip: standardTrip.trips[0],
        waypoints: standardTrip.waypoints,
        description: 'Optimized for shortest time'
      });
    }

    // Option 2: Roundtrip optimization (if more than 2 points)
    if (coordinates.length > 2) {
      try {
        const roundtripTrip = await getOptimizedTrip(coordinates, {
          steps: true,
          overview: 'full',
          roundtrip: true
        });

        if (roundtripTrip.trips.length > 0) {
          alternatives.push({
            type: 'roundtrip',
            name: 'Round Trip',
            trip: roundtripTrip.trips[0],
            waypoints: roundtripTrip.waypoints,
            description: 'Returns to starting point'
          });
        }
      } catch (error) {
        console.warn('Roundtrip optimization failed:', error);
      }
    }

    // Option 3: Point-to-point routes for comparison
    if (coordinates.length === 2) {
      try {
        const directRoute = await getRoute(coordinates[0], coordinates[1], {
          steps: true,
          alternatives: true,
          overview: 'full'
        });

        directRoute.routes.forEach((route, index) => {
          alternatives.push({
            type: 'direct',
            name: index === 0 ? 'Direct Route' : `Alternative ${index}`,
            trip: route,
            waypoints: directRoute.waypoints,
            description: index === 0 ? 'Most direct path' : 'Alternative route option'
          });
        });
      } catch (error) {
        console.warn('Direct route calculation failed:', error);
      }
    }

    return alternatives;
  } catch (error) {
    console.error('Error getting route alternatives:', error);
    throw error;
  }
}

/**
 * Get detailed turn-by-turn directions
 */
export function getTurnByTurnDirections(osrmRoute: OSRMRoute) {
  const directions: Array<{
    instruction: string;
    distance: number;
    duration: number;
    maneuver: string;
    location: [number, number];
  }> = [];

  osrmRoute.legs.forEach(leg => {
    leg.steps.forEach(step => {
      directions.push({
        instruction: step.name || 'Continue',
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver.type,
        location: step.maneuver.location
      });
    });
  });

  return directions;
}

/**
 * Export route data for sharing
 */
export function exportRouteData(osrmRoute: OSRMRoute, waypoints: OSRMWaypoint[]) {
  const routeData = {
    distance: formatDistance(osrmRoute.distance),
    duration: formatDuration(osrmRoute.duration),
    waypoints: waypoints.map(wp => ({
      name: wp.name,
      location: {
        lat: wp.location[1],
        lng: wp.location[0]
      }
    })),
    directions: getTurnByTurnDirections(osrmRoute),
    geometry: osrmRoute.geometry,
    exportedAt: new Date().toISOString()
  };

  return {
    json: JSON.stringify(routeData, null, 2),
    gpx: generateGPX(routeData),
    url: generateShareableURL(routeData)
  };
}

/**
 * Export route as GPX file (async version)
 */
export async function exportRouteAsGPX(routeData: any, filename: string = 'gaavconnect-route.gpx'): Promise<void> {
  return new Promise((resolve) => {
    const route = routeData.trips?.[0] || routeData.routes?.[0] || routeData;
    const waypoints = routeData.waypoints || [];
    
    const gpxData = {
      distance: formatDistance(route.distance || 0),
      duration: formatDuration(route.duration || 0),
      waypoints: waypoints.map((wp: any) => ({
        name: wp.name || 'Waypoint',
        location: {
          lat: wp.location?.[1] || wp.lat || 0,
          lng: wp.location?.[0] || wp.lng || 0
        }
      })),
      geometry: route.geometry || '',
      exportedAt: new Date().toISOString()
    };
    
    const gpxContent = generateGPX(gpxData);
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    resolve();
  });
}

/**
 * Generate GPX file content for GPS devices
 */
function generateGPX(routeData: any): string {
  const path = decodePolyline(routeData.geometry || '');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GaavConnect">
  <metadata>
    <name>GaavConnect Route</name>
    <desc>Generated by GaavConnect - ${routeData.distance} in ${routeData.duration}</desc>
    <time>${routeData.exportedAt}</time>
  </metadata>
  <trk>
    <name>Optimized Route</name>
    <trkseg>
      ${path.map(([lat, lng]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`).join('\n')}
    </trkseg>
  </trk>
  ${routeData.waypoints.map((wp: any, index: number) => `
  <wpt lat="${wp.location.lat}" lon="${wp.location.lng}">
    <name>${wp.name || `Waypoint ${index + 1}`}</name>
  </wpt>`).join('')}
</gpx>`;
}

/**
 * Generate shareable URL with route data
 */
export function generateShareableURL(routeData: any): string {
  const baseUrl = window.location.origin;
  const route = routeData.trips?.[0] || routeData.routes?.[0] || routeData;
  const waypoints = routeData.waypoints || [];
  
  const routeParams = new URLSearchParams({
    waypoints: waypoints.map((wp: any) => `${wp.location?.[1] || wp.lat},${wp.location?.[0] || wp.lng}`).join(';'),
    distance: route.distance?.toString() || '0',
    duration: route.duration?.toString() || '0',
    algorithm: routeData.algorithm || 'osrm'
  });
  
  return `${baseUrl}?${routeParams.toString()}`;
}

/**
 * Get route summary with OSRM optimization
 */
export async function getRouteSummary(coordinates: OSRMCoordinate[]) {
  try {
    const tripData = await getOptimizedTrip(coordinates, {
      steps: true,
      overview: 'full'
    });

    if (tripData.trips.length === 0) {
      throw new Error('No trip found');
    }

    const trip = tripData.trips[0];
    const convertedRoute = convertOSRMToGoogleMaps(trip);

    return {
      distance: formatDistance(trip.distance),
      duration: formatDuration(trip.duration),
      path: convertedRoute.path,
      waypoints: tripData.waypoints,
      optimizedOrder: tripData.waypoints.map((_, index) => index),
      directions: getTurnByTurnDirections(trip),
      rawData: tripData
    };
  } catch (error) {
    console.error('Error getting route summary:', error);
    throw error;
  }
}
