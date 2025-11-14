/**
 * Real-time location autocomplete using Google Places API
 * Falls back to Hyderabad mock data only when API key is invalid
 */

import * as mockPlaces from './mockPlacesAutocomplete';

// Extend Window interface for Google Maps callback
declare global {
  interface Window {
    google?: any;
    initGoogleMaps?: () => void;
  }
  
  // Extend ImportMeta for Vite env variables
  interface ImportMeta {
    readonly env: {
      readonly VITE_GOOGLE_MAPS_API_KEY?: string;
    };
  }
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

let autocompleteService: any = null;
let placesService: any = null;
let useMockAPI = false;
let servicesInitialized = false;

/**
 * Initialize Places Services - use mock API for demo
 */
export async function initializePlacesServices(): Promise<void> {
  if (servicesInitialized) return;

  // For development/demo, use mock API with Hyderabad locations
  console.log('📍 Using Hyderabad mock locations data');
  autocompleteService = mockPlaces;
  placesService = mockPlaces;
  useMockAPI = true;
  servicesInitialized = true;
}

/**
 * Get place predictions for autocomplete
 */
export async function getPlacePredictions(input: string): Promise<PlacePrediction[]> {
  console.log('getPlacePredictions called with:', input);
  if (!input.trim()) return [];
  
  try {
    await initializePlacesServices();
    console.log('useMockAPI:', useMockAPI);
    
    if (useMockAPI) {
      console.log('Using mock API for predictions');
      const result = await mockPlaces.getPlacePredictions(input);
      console.log('Mock predictions result:', result);
      return result;
    }
    
    console.log('Using real Google API for predictions');
    return new Promise((resolve) => {
      autocompleteService.getPlacePredictions(
        {
          input,
          types: ['(cities)', 'establishment', 'geocode'],
          componentRestrictions: { country: 'in' }, // Restrict to India
        },
        (predictions: any[], status: any) => {
          console.log('Real API predictions:', predictions, 'status:', status);
          if (status === 'OK' || status === 'ZERO_RESULTS') {
            resolve(predictions || []);
          } else {
            console.error('Autocomplete service error:', status);
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting predictions:', error);
    return [];
  }
}

/**
 * Get detailed place information including coordinates
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  console.log('getPlaceDetails called with placeId:', placeId);
  if (!placeId) return null;
  
  try {
    await initializePlacesServices();
    console.log('useMockAPI in getPlaceDetails:', useMockAPI);
    
    if (useMockAPI) {
      console.log('Using mock API for place details');
      const result = await mockPlaces.getPlaceDetails(placeId);
      console.log('Mock place details result:', result);
      return result;
    }
    
    console.log('Using real Google API for place details');
    return new Promise((resolve) => {
      placesService.getDetails(
        {
          placeId,
          fields: ['name', 'formatted_address', 'geometry', 'types'],
        },
        (place: any, status: any) => {
          console.log('Real API place details:', place, 'status:', status);
          if (status === 'OK' && place) {
            resolve({
              place_id: placeId,
              name: place.name,
              formatted_address: place.formatted_address,
              geometry: place.geometry,
              types: place.types || [],
            });
          } else {
            console.error('Place details error:', status);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Search for places by text query (alternative to autocomplete)
 */
export async function searchPlaces(query: string): Promise<PlaceDetails[]> {
  if (!query.trim()) return [];
  
  try {
    await initializePlacesServices();
    
    if (useMockAPI) {
      return mockPlaces.searchPlaces(query);
    }
    
    return new Promise((resolve) => {
      placesService.textSearch(
        {
          query,
          region: 'in',
          type: 'geocode',
        },
        (results: any[], status: any) => {
          if (status === 'OK' || status === 'ZERO_RESULTS') {
            const places = (results || []).map((place: any) => ({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.formatted_address,
              geometry: {
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                },
              },
              types: place.types || [],
            }));
            resolve(places);
          } else {
            console.error('Text search error:', status);
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}
