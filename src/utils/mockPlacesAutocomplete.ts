/**
 * Mock Google Places API for testing without valid API key
 */

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

// Mock location data for Hyderabad testing
const MOCK_LOCATIONS = [
  {
    place_id: 'mock1',
    description: 'Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Hyderabad',
      secondary_text: 'Telangana, India'
    },
    geometry: { location: { lat: 17.3850, lng: 78.4867 } }
  },
  {
    place_id: 'mock2',
    description: 'Secunderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Secunderabad',
      secondary_text: 'Telangana, India'
    },
    geometry: { location: { lat: 17.4399, lng: 78.4983 } }
  },
  {
    place_id: 'mock3',
    description: 'Gachibowli, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Gachibowli',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.4475, lng: 78.3469 } }
  },
  {
    place_id: 'mock4',
    description: 'Hitech City, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Hitech City',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.4463, lng: 78.3788 } }
  },
  {
    place_id: 'mock5',
    description: 'Banjara Hills, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Banjara Hills',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.4135, lng: 78.4575 } }
  },
  {
    place_id: 'mock6',
    description: 'Jubilee Hills, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Jubilee Hills',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.4169, lng: 78.4234 } }
  },
  {
    place_id: 'mock7',
    description: 'Madhapur, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Madhapur',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.4488, lng: 78.3908 } }
  },
  {
    place_id: 'mock8',
    description: 'Kukatpally, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Kukatpally',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.4915, lng: 78.3930 } }
  },
  {
    place_id: 'mock9',
    description: 'Lingampally, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Lingampally',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.5147, lng: 78.3228 } }
  },
  {
    place_id: 'mock10',
    description: 'Miyapur, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Miyapur',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.5177, lng: 78.3619 } }
  },
  {
    place_id: 'mock11',
    description: 'Charminar, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Charminar',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.3616, lng: 78.4747 } }
  },
  {
    place_id: 'mock12',
    description: 'Golkonda Fort, Hyderabad, Telangana, India',
    structured_formatting: {
      main_text: 'Golkonda Fort',
      secondary_text: 'Hyderabad, Telangana, India'
    },
    geometry: { location: { lat: 17.3843, lng: 78.4018 } }
  }
];

let autocompleteService: any = null;
let placesService: any = null;

/**
 * Initialize mock Places services
 */
export async function initializePlacesServices(): Promise<void> {
  if (autocompleteService && placesService) {
    return;
  }

  // Create mock services
  autocompleteService = {
    getPlacePredictions: (request: any, callback: any) => {
      const { input } = request;
      if (!input || input.length < 2) {
        callback([], 'OK');
        return;
      }

      // Filter mock locations based on input
      const filtered = MOCK_LOCATIONS.filter(loc => 
        loc.description.toLowerCase().includes(input.toLowerCase()) ||
        loc.structured_formatting.main_text.toLowerCase().includes(input.toLowerCase())
      );

      callback(filtered, 'OK');
    }
  };

  placesService = {
    getDetails: (request: any, callback: any) => {
      const { placeId } = request;
      const location = MOCK_LOCATIONS.find(loc => loc.place_id === placeId);
      
      if (location) {
        callback({
          place_id: location.place_id,
          name: location.structured_formatting.main_text,
          formatted_address: location.description,
          geometry: location.geometry,
          types: ['locality', 'political'],
        }, 'OK');
      } else {
        callback(null, 'ZERO_RESULTS');
      }
    },
    textSearch: (request: any, callback: any) => {
      const { query } = request;
      if (!query || query.length < 2) {
        callback([], 'OK');
        return;
      }

      // Filter mock locations based on query
      const filtered = MOCK_LOCATIONS.filter(loc => 
        loc.description.toLowerCase().includes(query.toLowerCase()) ||
        loc.structured_formatting.main_text.toLowerCase().includes(query.toLowerCase())
      );

      // Map to proper PlaceDetails format
      const results = filtered.map(loc => ({
        place_id: loc.place_id,
        name: loc.structured_formatting.main_text,
        formatted_address: loc.description,
        geometry: loc.geometry,
        types: ['locality', 'political'],
      }));

      callback(results, 'OK');
    }
  };
}

/**
 * Get place predictions for autocomplete (mock)
 */
export async function getPlacePredictions(input: string): Promise<PlacePrediction[]> {
  console.log('Mock getPlacePredictions called with:', input);
  if (!input.trim()) return [];
  
  try {
    await initializePlacesServices();
    
    if (!input || input.length < 2) {
      return [];
    }

    // Filter mock locations based on input
    const filtered = MOCK_LOCATIONS.filter(loc => 
      loc.description.toLowerCase().includes(input.toLowerCase()) ||
      loc.structured_formatting.main_text.toLowerCase().includes(input.toLowerCase())
    );

    console.log('Mock predictions filtered:', filtered);
    return filtered;
  } catch (error) {
    console.error('Error getting predictions:', error);
    return [];
  }
}

/**
 * Get detailed place information including coordinates (mock)
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  console.log('Mock getPlaceDetails called with:', placeId);
  if (!placeId) return null;
  
  try {
    await initializePlacesServices();
    
    const location = MOCK_LOCATIONS.find(loc => loc.place_id === placeId);
    
    if (location) {
      const details: PlaceDetails = {
        place_id: location.place_id,
        name: location.structured_formatting.main_text,
        formatted_address: location.description,
        geometry: location.geometry,
        types: ['locality', 'political'],
      };
      console.log('Mock place details found:', details);
      return details;
    } else {
      console.warn('Mock place not found for placeId:', placeId);
      return null;
    }
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Search for places by text query (mock)
 */
export async function searchPlaces(query: string): Promise<PlaceDetails[]> {
  console.log('Mock searchPlaces called with:', query);
  if (!query.trim()) return [];
  
  try {
    await initializePlacesServices();
    
    // Filter mock locations based on query
    const filtered = MOCK_LOCATIONS.filter(loc => 
      loc.description.toLowerCase().includes(query.toLowerCase()) ||
      loc.structured_formatting.main_text.toLowerCase().includes(query.toLowerCase())
    );

    const places = filtered.map((location: any) => ({
      place_id: location.place_id,
      name: location.structured_formatting.main_text,
      formatted_address: location.description,
      geometry: location.geometry,
      types: ['locality', 'political'],
    }));
    
    console.log('Mock search results:', places);
    return places;
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}
