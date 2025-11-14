import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OSRMCoordinate, OSRMRoute, decodePolyline, formatDistance, formatDuration } from '../utils/osrmApi';

// Fix Leaflet's default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  coordinates?: OSRMCoordinate[];
  route?: OSRMRoute;
  showWaypoints?: boolean;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [17.3850, 78.4867], // Default to Hyderabad
  zoom = 12,
  height = '400px',
  coordinates = [],
  route,
  showWaypoints = true,
  interactive = true,
  onMapClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Custom icons for different marker types
  const createCustomIcon = (type: 'start' | 'end' | 'waypoint', label?: string) => {
    const colors = {
      start: '#22c55e',
      end: '#ef4444',
      waypoint: '#6A0DAD'
    };

    return L.divIcon({
      html: `
        <div style="
          background-color: ${colors[type]};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          z-index: 1000;
        ">
          ${label || (type === 'start' ? 'S' : type === 'end' ? 'E' : type === 'waypoint' ? 'W' : '')}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: interactive
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Handle map clicks if interactive
    if (interactive && onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    mapInstanceRef.current.setView(center, zoom);
  }, [center, zoom, mapReady]);

  // Clear existing markers and route
  const clearMapElements = () => {
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    if (routeLayerRef.current) {
      mapInstanceRef.current?.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
  };

  // Add markers for coordinates
  const addMarkers = () => {
    if (!mapInstanceRef.current || !showWaypoints) return;

    coordinates.forEach((coord, index) => {
      let iconType: 'start' | 'end' | 'waypoint' = 'waypoint';
      let label: string;

      if (index === 0) {
        iconType = 'start';
        label = 'S';
      } else if (index === coordinates.length - 1) {
        iconType = 'end';
        label = 'E';
      } else {
        label = (index).toString();
      }

      const marker = L.marker([coord.lat, coord.lng], {
        icon: createCustomIcon(iconType, label)
      });

      // Add popup with location info
      marker.bindPopup(`
        <div style="min-width: 150px;">
          <strong>Location ${index + 1}</strong><br>
          Lat: ${coord.lat.toFixed(6)}<br>
          Lng: ${coord.lng.toFixed(6)}
        </div>
      `);

      marker.addTo(mapInstanceRef.current!);
      markersRef.current.push(marker);
    });
  };

  // Add route polyline
  const addRoute = () => {
    if (!mapInstanceRef.current || !route) return;

    const decodedPath = decodePolyline(route.geometry);
    
    // Create route polyline
    const routePolyline = L.polyline(decodedPath, {
      color: '#6A0DAD',
      weight: 6,
      opacity: 0.8,
      smoothFactor: 1
    });

    routePolyline.addTo(mapInstanceRef.current);
    routeLayerRef.current = routePolyline;

    // Add arrow markers for direction
    decodedPath.forEach((point, index) => {
      if (index % 5 === 0 && index < decodedPath.length - 1) {
        const nextPoint = decodedPath[index + 1];
        const angle = Math.atan2(nextPoint[0] - point[0], nextPoint[1] - point[1]) * 180 / Math.PI;
        
        const arrowIcon = L.divIcon({
          html: `
            <div style="
              transform: rotate(${angle}deg);
              font-size: 16px;
              color: #6A0DAD;
            ">➤</div>
          `,
          className: 'route-arrow',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const arrowMarker = L.marker(point, { icon: arrowIcon });
        arrowMarker.addTo(mapInstanceRef.current!);
        markersRef.current.push(arrowMarker);
      }
    });

    // Update route info
    setRouteInfo({
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration)
    });

    // Fit map to route bounds
    if (decodedPath.length > 0) {
      const bounds = L.latLngBounds(decodedPath);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Update map when coordinates or route changes
  useEffect(() => {
    if (!mapReady) return;

    clearMapElements();
    addMarkers();
    addRoute();
  }, [coordinates, route, mapReady, showWaypoints]);

  return (
    <div className="relative">
      {/* Route info display */}
      {routeInfo && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 border border-purple-200">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-700">Distance: {routeInfo.distance}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="font-medium text-gray-700">Duration: {routeInfo.duration}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          height,
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}
        className="leaflet-container"
      />

      {/* Loading indicator */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {/* Legend */}
      {showWaypoints && coordinates.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 border border-purple-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
              <span>Start Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
              <span>End Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow"></div>
              <span>Waypoints</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-purple-600"></div>
              <span>Route</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
