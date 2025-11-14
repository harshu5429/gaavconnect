import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { Stop } from '../App';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../utils/googleMapsLoader';
import { FallbackMap } from './FallbackMap';

interface MapViewProps {
  origin?: string;
  stops: Stop[];
  showRoute?: boolean;
  height?: string;
  totalDistance?: string;
  totalDuration?: string;
  totalCost?: number;
}

export function MapView({ 
  origin, 
  stops, 
  showRoute = true,
  height = '400px',
  totalDistance,
  totalDuration,
  totalCost
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routePolylineRef = useRef<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadMaps = async () => {
      try {
        if (isGoogleMapsLoaded()) {
          setGoogleMapsLoaded(true);
          return;
        }

        await loadGoogleMapsAPI();
        setGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load Google Maps';
        if (errorMessage.includes('API key is not configured')) {
          setLoadingError('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
        } else if (errorMessage.includes('InvalidKeyMapError') || errorMessage.includes('Invalid Google Maps API key')) {
          setLoadingError('Invalid Google Maps API key. Please check your API key configuration and ensure the Maps JavaScript API is enabled in your Google Cloud Console.');
        } else {
          setLoadingError(errorMessage);
        }
        setGoogleMapsLoaded(false);
      }
    };

    loadMaps();
  }, []);

  // Force show fallback map if there are stops but Google Maps failed to load
  useEffect(() => {
    if ((stops.length > 0 || origin) && !googleMapsLoaded && !loadingError) {
      setLoadingError('Google Maps is not available. Showing route summary instead.');
    }
  }, [stops, origin, googleMapsLoaded, loadingError]);

  // Initialize Google Map
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    
    // Default coordinates (Hyderabad)
    const DEFAULT_LAT = 17.3850;
    const DEFAULT_LNG = 78.4867;

    try {
      // Initialize map
      const map = new window.google.maps.Map(container, {
        zoom: 12,
        center: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapRef.current = map;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }

      // Create bounds to fit all markers
      const bounds = new window.google.maps.LatLngBounds();

      // Add origin marker
      if (origin) {
        const originCoords = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
        
        // Create custom pin element
        const originPinElement = document.createElement('div');
        originPinElement.innerHTML = `
          <div style="
            width: 32px;
            height: 40px;
            position: relative;
            cursor: pointer;
          ">
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z" fill="#8B2DC2"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <text x="16" y="20" text-anchor="middle" fill="#8B2DC2" font-size="12" font-weight="bold">S</text>
            </svg>
          </div>
        `;
        
        // Use basic marker if AdvancedMarkerElement is not available (fallback for invalid API keys)
        let originMarker;
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          originMarker = new window.google.maps.marker.AdvancedMarkerElement({
            position: originCoords,
            map: map,
            title: `Start: ${origin}`,
            content: originPinElement,
            gmpClickable: true
          });
        } else {
          // Fallback to basic marker
          originMarker = new window.google.maps.Marker({
            position: originCoords,
            map: map,
            title: `Start: ${origin}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#8B2DC2',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              labelOrigin: new window.google.maps.Point(0, 0)
            },
            label: {
              text: 'S',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 'bold'
            }
          });
        }

        const originInfoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 8px;"><strong>Starting Point</strong><br/>${origin}</div>`
        });

        originMarker.addListener('click', () => {
          originInfoWindow.open(map, originMarker);
        });

        markersRef.current.push(originMarker);
        bounds.extend(originCoords);
      }

      // Add destination markers
      stops.forEach((stop, index) => {
        const stopCoords = { 
          lat: stop.lat || (DEFAULT_LAT + (Math.random() - 0.5) * 0.1), 
          lng: stop.lng || (DEFAULT_LNG + (Math.random() - 0.5) * 0.1)
        };

        // Create custom pin element for stops
        const stopPinElement = document.createElement('div');
        stopPinElement.innerHTML = `
          <div style="
            width: 32px;
            height: 40px;
            position: relative;
            cursor: pointer;
          ">
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z" fill="#6A0DAD"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <text x="16" y="20" text-anchor="middle" fill="#6A0DAD" font-size="10" font-weight="bold">${index + 1}</text>
            </svg>
          </div>
        `;

        // Use basic marker if AdvancedMarkerElement is not available (fallback for invalid API keys)
        let stopMarker;
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          stopMarker = new window.google.maps.marker.AdvancedMarkerElement({
            position: stopCoords,
            map: map,
            title: `Stop ${index + 1}: ${stop.name}`,
            content: stopPinElement,
            gmpClickable: true
          });
        } else {
          // Fallback to basic markers
          stopMarker = new window.google.maps.Marker({
            position: stopCoords,
            map: map,
            title: `Stop ${index + 1}: ${stop.name}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#6A0DAD',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              labelOrigin: new window.google.maps.Point(0, 0)
            },
            label: {
              text: `${index + 1}`,
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });
        }

        const stopInfoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 8px;"><strong>Destination ${index + 1}</strong><br/>${stop.name}<br/><small>Lat: ${stopCoords.lat.toFixed(6)}, Lng: ${stopCoords.lng.toFixed(6)}</small></div>`
        });

        stopMarker.addListener('click', () => {
          stopInfoWindow.open(map, stopMarker);
        });

        markersRef.current.push(stopMarker);
        bounds.extend(stopCoords);
      });

      // Fit map to show all markers
      if (markersRef.current.length > 0) {
        map.fitBounds(bounds);
        
        // Ensure minimum zoom level
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
          if (map.getZoom() > 15) map.setZoom(15);
          window.google.maps.event.removeListener(listener);
        });
      }

      // Draw simple route line if we have origin and destinations
      if (showRoute && origin && stops.length > 0) {
        const routeCoordinates = [
          { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
          ...stops.map(stop => ({ lat: stop.lat, lng: stop.lng }))
        ];

        const routePolyline = new window.google.maps.Polyline({
          path: routeCoordinates,
          geodesic: true,
          strokeColor: '#6A0DAD',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: map
        });

        routePolylineRef.current = routePolyline;
      }

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setGoogleMapsLoaded(false);
    }
  }, [googleMapsLoaded, origin, stops, showRoute]);

  // Show fallback map if Google Maps failed to load
  if (loadingError) {
    return (
      <div style={{ height }}>
        <FallbackMap
          origin={origin}
          stops={stops}
          totalDistance={totalDistance}
          totalDuration={totalDuration}
          totalCost={totalCost}
        />
      </div>
    );
  }

  if (stops.length === 0 && !origin) {
    return (
      <div 
        className="rounded-lg border-2 border-dashed border-[#CBA0F5] bg-gradient-to-br from-[#F5F3FF] to-white flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Add stops to see them on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef}
      className="rounded-lg border-2 border-[#CBA0F5] overflow-hidden shadow-lg relative"
      style={{ height }}
    >
      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-[#6A0DAD] hover:bg-[#E6E6FA] transition-colors border border-[#CBA0F5]">
          +
        </button>
        <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-[#6A0DAD] hover:bg-[#E6E6FA] transition-colors border border-[#CBA0F5]">
          −
        </button>
        <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-[#6A0DAD] hover:bg-[#E6E6FA] transition-colors border border-[#CBA0F5]">
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3 border border-[#CBA0F5]">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#8B2DC2]"></div>
            <span className="text-gray-700">Origin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6A0DAD]"></div>
            <span className="text-gray-700">Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#6A0DAD]"></div>
            <span className="text-gray-700">Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
