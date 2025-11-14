/**
 * Google Maps API Loader
 * Dynamically loads the Google Maps API with the correct API key
 */

import { config } from '../config/env';

let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsAPI(): Promise<void> {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (isLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Create new loading promise
  loadPromise = new Promise((resolve, reject) => {
    // Check if API key is available
    const apiKey = config.googleMaps.apiKey;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
      reject(new Error('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    
    const libraries = config.googleMaps.libraries.join(',');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&callback=initGoogleMaps`;
    
    // Set up global callback
    window.initGoogleMaps = () => {
      isLoaded = true;
      resolve();
    };

    // Set up error handling for Google Maps API
    window.gm_authFailure = () => {
      reject(new Error('Invalid Google Maps API key. Please check your API key configuration and ensure the Maps JavaScript API is enabled.'));
    };

    // Handle errors
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add script to document
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && window.google && window.google.maps !== undefined;
}

// Extend Window interface for the global callback
declare global {
  interface Window {
    initGoogleMaps?: () => void;
    google?: any;
  }
}
