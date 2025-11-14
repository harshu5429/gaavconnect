/**
 * Real-time geocoding and reverse geocoding utilities
 * Uses multiple fallback services for reliability
 */

export interface GeocodingResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  types: string[];
}

/**
 * Helper function to make CORS-enabled requests using a proxy
 */
async function fetchWithCORS(url: string, options: RequestInit = {}): Promise<Response> {
  // Try direct request first (might work in some environments)
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors'
    });
    return response;
  } catch (corsError) {
    console.warn('Direct CORS request failed, trying proxy:', corsError);
  }

  // Fallback to CORS proxy
  const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
  try {
    const response = await fetch(proxyUrl, options);
    return response;
  } catch (proxyError) {
    console.warn('Proxy request failed, trying Nominatim mirror:', proxyError);
  }

  // Final fallback to a different Nominatim mirror that supports CORS
  const mirrorUrl = url.replace('nominatim.openstreetmap.org', 'nominatim.openstreetmap.franklin.dev');
  const response = await fetch(mirrorUrl, {
    ...options,
    mode: 'cors'
  });
  
  return response;
}

/**
 * Reverse geocode coordinates to get location details
 * Uses multiple services with CORS fallbacks
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  try {
    // Primary: Nominatim (OpenStreetMap) - Free and reliable
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetchWithCORS(nominatimUrl, {
      headers: {
        'User-Agent': 'GaavConnect/1.0 (Rural Transport App)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Nominatim error: ${data.error}`);
    }
    
    // Format the response to match our interface
    const result: GeocodingResult = {
      place_id: data.place_id?.toString() || `${lat}_${lng}`,
      name: data.display_name?.split(',')[0] || 'Unknown Location',
      formatted_address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      geometry: {
        location: { lat: parseFloat(data.lat), lng: parseFloat(data.lon) }
      },
      types: [data.type || 'establishment']
    };
    
    return result;
    
  } catch (error) {
    console.warn('Primary geocoding failed, using fallback:', error);
    
    // Fallback: Try BigDataCloud API (supports CORS)
    try {
      const bigDataUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const response = await fetch(bigDataUrl);
      
      if (response.ok) {
        const data = await response.json();
        return {
          place_id: `bigdata_${lat}_${lng}`,
          name: data.locality || data.city || 'Unknown Location',
          formatted_address: data.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          geometry: {
            location: { lat, lng }
          },
          types: ['establishment']
        };
      }
    } catch (bigDataError) {
      console.warn('BigDataCloud fallback failed:', bigDataError);
    }
    
    // Final fallback: Return coordinates with basic formatting
    return {
      place_id: `fallback_${lat}_${lng}`,
      name: 'Current Location',
      formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      geometry: {
        location: { lat, lng }
      },
      types: ['establishment']
    };
  }
}

/**
 * Forward geocode address to get coordinates
 * Uses multiple services with CORS fallbacks
 */
export async function forwardGeocode(address: string): Promise<GeocodingResult[]> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&addressdetails=1`;
    
    const response = await fetchWithCORS(nominatimUrl, {
      headers: {
        'User-Agent': 'GaavConnect/1.0 (Rural Transport App)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim search error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      place_id: item.place_id?.toString() || item.osm_id?.toString() || 'unknown',
      name: item.display_name?.split(',')[0] || item.name || 'Unknown',
      formatted_address: item.display_name || 'Unknown Address',
      geometry: {
        location: { 
          lat: parseFloat(item.lat), 
          lng: parseFloat(item.lon) 
        }
      },
      types: [item.type || item.class || 'establishment']
    }));
    
  } catch (error) {
    console.warn('Nominatim forward geocoding failed, trying fallback:', error);
    
    // Fallback: Try BigDataCloud API
    try {
      const bigDataUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en&search=${encodeURIComponent(address)}`;
      const response = await fetch(bigDataUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.formatted) {
          return [{
            place_id: `bigdata_search_${Date.now()}`,
            name: data.locality || data.city || address,
            formatted_address: data.formatted,
            geometry: {
              location: { 
                lat: data.latitude || 0, 
                lng: data.longitude || 0 
              }
            },
            types: ['establishment']
          }];
        }
      }
    } catch (bigDataError) {
      console.warn('BigDataCloud forward geocoding failed:', bigDataError);
    }
    
    console.error('All forward geocoding services failed:', error);
    return [];
  }
}

/**
 * Get current position with high accuracy
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  });
}

/**
 * Validate coordinates are within reasonable bounds
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculate real-time distance using Haversine formula
 * Enhanced with better precision
 */
export function calculateRealTimeDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (!validateCoordinates(lat1, lng1) || !validateCoordinates(lat2, lng2)) {
    throw new Error('Invalid coordinates provided');
  }
  
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
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places for precision
}
