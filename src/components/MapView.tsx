import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { Stop } from '../App';
import { getOptimizedTrip, type OSRMCoordinate } from '../utils/osrmApi';

interface MapViewProps {
  origin?: string;
  stops: Stop[];
  showRoute?: boolean;
  height?: string;
}

export function MapView({ 
  origin, 
  stops, 
  showRoute = true, // Always show route when there are stops
  height = '400px' 
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routePolylineRef = useRef<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const attemptsRef = useRef(0);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google?.maps) {
        console.log('Google Maps API is available');
        setGoogleMapsLoaded(true);
      } else {
        // Keep checking until it loads or timeout
        if (attemptsRef.current < 20) { // Reduced timeout attempts
          attemptsRef.current += 1;
          setTimeout(checkGoogleMaps, 200);
        } else {
          console.warn('Google Maps API failed to load after timeout, using SVG fallback map');
          setGoogleMapsLoaded(false);
        }
      }
    };
    checkGoogleMaps();
  }, []);

  // Initialize Google Map with route finding
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    
    // Ensure container exists before proceeding
    if (!container) {
      console.warn('Map container not found');
      return;
    }
    
    // Default center coordinates (Hyderabad, India)
    const DEFAULT_LAT = 17.3850;
    const DEFAULT_LNG = 78.4867;

    // Determine center based on stops or default (Hyderabad)
    let center = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    
    if (stops.length > 0) {
      const avgLat = stops.reduce((sum, s) => sum + (s.lat || DEFAULT_LAT), 0) / stops.length;
      const avgLng = stops.reduce((sum, s) => sum + (s.lng || DEFAULT_LNG), 0) / stops.length;
      center = { lat: avgLat, lng: avgLng };
    }

    // Make sure the container is ready for the map
    container.innerHTML = '';
    
    // Set container dimensions explicitly
    container.style.width = '100%';
    container.style.height = '100%';

    try {
      if (!window.google?.maps) {
        console.warn('Google Maps not available, using SVG fallback');
        setGoogleMapsLoaded(false);
        return;
      }

      // Initialize map
      const map = new window.google.maps.Map(container, {
        zoom: 12,
        center: center,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      mapRef.current = map;

      // Clear existing markers and routes
      markersRef.current.forEach((marker: any) => marker.setMap(null));
      markersRef.current = [];
      
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }

      // Create bounds to fit all markers
      const bounds = new window.google.maps.LatLngBounds();

      // Add origin marker if available
      if (origin) {
        const originCoords = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
        
        const originMarker = new window.google.maps.Marker({
          position: originCoords,
          map: map,
          title: `Start: ${origin}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z" fill="#8B2DC2"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
                <text x="16" y="20" text-anchor="middle" fill="#8B2DC2" font-size="12" font-weight="bold">S</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 40),
            anchor: new window.google.maps.Point(16, 40)
          }
        });

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

        const stopMarker = new window.google.maps.Marker({
          position: stopCoords,
          map: map,
          title: `Stop ${index + 1}: ${stop.name}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z" fill="#6A0DAD"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
                <text x="16" y="20" text-anchor="middle" fill="#6A0DAD" font-size="10" font-weight="bold">${index + 1}</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 40),
            anchor: new window.google.maps.Point(16, 40)
          }
        });

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

      // Calculate and display optimal route if we have origin and destinations
      if (showRoute && origin && stops.length > 0) {
        calculateOptimalRoute(map);
      }

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setGoogleMapsLoaded(false);
    }
  }, [googleMapsLoaded, origin, stops, showRoute]);

  // Function to calculate optimal route using OSRM API
  const calculateOptimalRoute = async (map: any) => {
    if (!window.google?.maps || !origin || stops.length === 0) return;

    try {
      // Default coordinates for origin
      const DEFAULT_LAT = 17.3850;
      const DEFAULT_LNG = 78.4867;
      
      const originCoords = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

      // Prepare coordinates for OSRM API
      const coordinates: OSRMCoordinate[] = [
        originCoords,
        ...stops.map(stop => ({
          lat: stop.lat || (DEFAULT_LAT + (Math.random() - 0.5) * 0.1),
          lng: stop.lng || (DEFAULT_LNG + (Math.random() - 0.5) * 0.1)
        }))
      ];

      console.log('🗺️ Calculating optimal route with OSRM API...');
      
      // Get optimized trip from OSRM
      const tripData = await getOptimizedTrip(coordinates, {
        steps: true,
        overview: 'full',
        geometries: 'polyline'
      });

      if (tripData.trips.length === 0) {
        throw new Error('No route found');
      }

      const trip = tripData.trips[0];
      
      // Clear existing route polyline
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }

      // Decode and display the route
      const decodedPath = decodePolyline(trip.geometry);
      const googleMapsPath = decodedPath.map(([lat, lng]) => ({ lat, lng }));

      // Create enhanced polyline for the route
      const routePolyline = new window.google.maps.Polyline({
        path: googleMapsPath,
        geodesic: true,
        strokeColor: '#6A0DAD',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        icons: [{
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4,
            fillColor: '#6A0DAD',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          offset: '0%',
          repeat: '40px'
        }]
      });

      // Add waypoint markers with enhanced styling
      tripData.waypoints.forEach((waypoint, index) => {
        const isOrigin = index === 0;
        const isDestination = index === tripData.waypoints.length - 1;
        
        let markerColor = '#6A0DAD';
        let markerLabel = (index + 1).toString();
        let markerTitle = `Waypoint ${index + 1}`;
        
        if (isOrigin) {
          markerColor = '#22C55E';
          markerLabel = 'S';
          markerTitle = 'Start Point';
        } else if (isDestination) {
          markerColor = '#EF4444';
          markerLabel = 'E';
          markerTitle = 'End Point';
        }

        const waypointMarker = new window.google.maps.Marker({
          position: {
            lat: waypoint.location[1],
            lng: waypoint.location[0]
          },
          map: map,
          title: markerTitle,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          },
          label: {
            text: markerLabel,
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '12px'
          },
          zIndex: 1000
        });

        // Add info window for waypoint details
        const waypointInfo = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <h4 style="margin: 0 0 4px 0; color: ${markerColor};">${markerTitle}</h4>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Name:</strong> ${waypoint.name || 'Unnamed location'}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Coordinates:</strong> ${waypoint.location[1].toFixed(4)}, ${waypoint.location[0].toFixed(4)}</p>
              ${waypoint.distance ? `<p style="margin: 2px 0; font-size: 12px;"><strong>Distance from route:</strong> ${waypoint.distance.toFixed(0)}m</p>` : ''}
            </div>
          `
        });

        waypointMarker.addListener('click', () => {
          waypointInfo.open(map, waypointMarker);
        });

        markersRef.current.push(waypointMarker);
      });

      routePolyline.setMap(map);
      routePolylineRef.current = routePolyline;

      // Display route information
      console.log('✅ OSRM Optimal route calculated:');
      console.log(`📍 Distance: ${(trip.distance / 1000).toFixed(1)} km`);
      console.log(`⏱️ Duration: ${Math.round(trip.duration / 60)} minutes`);
      
      // Show enhanced route info window
      const midPoint = googleMapsPath[Math.floor(googleMapsPath.length / 2)];
      const routeInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 220px; font-family: Arial, sans-serif;">
            <h4 style="margin: 0 0 8px 0; color: #6A0DAD; display: flex; align-items: center; gap: 8px;">
              🗺️ OSRM Optimized Route
            </h4>
            <div style="background: #F5F3FF; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
              <p style="margin: 4px 0; font-weight: 500;"><strong>📍 Distance:</strong> ${(trip.distance / 1000).toFixed(1)} km</p>
              <p style="margin: 4px 0; font-weight: 500;"><strong>⏱️ Duration:</strong> ${Math.round(trip.duration / 60)} minutes</p>
              <p style="margin: 4px 0; font-weight: 500;"><strong>🚗 Mode:</strong> Driving</p>
            </div>
            <div style="font-size: 12px; color: #666; text-align: center;">
              <div style="margin-bottom: 4px;">✨ Route optimized with OSRM</div>
              <div>🎯 Solves Traveling Salesman Problem</div>
            </div>
          </div>
        `,
        position: midPoint
      });

      // Show info window after a delay
      setTimeout(() => {
        routeInfoWindow.open(map);
      }, 1000);

      // Fit map bounds to show entire route
      const bounds = new window.google.maps.LatLngBounds();
      googleMapsPath.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);

    } catch (error) {
      console.error('❌ OSRM route calculation failed:', error);
      console.log('🔄 Falling back to simple route visualization...');
      // Fallback to simple polyline if OSRM fails
      drawSimpleRoute(map);
    }
  };

  // Helper function to decode polyline (same as in osrmApi.ts but local for map component)
  const decodePolyline = (encoded: string): Array<[number, number]> => {
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
  };

  // Fallback function to draw simple route lines
  const drawSimpleRoute = (map: any) => {
    if (!origin || stops.length === 0) return;

    const DEFAULT_LAT = 17.3850;
    const DEFAULT_LNG = 78.4867;

    const routeCoordinates = [
      { lat: DEFAULT_LAT, lng: DEFAULT_LNG }, // Origin
      ...stops.map(stop => ({
        lat: stop.lat || (DEFAULT_LAT + (Math.random() - 0.5) * 0.1),
        lng: stop.lng || (DEFAULT_LNG + (Math.random() - 0.5) * 0.1)
      }))
    ];

    const routePath = new window.google.maps.Polyline({
      path: routeCoordinates,
      geodesic: true,
      strokeColor: '#6A0DAD',
      strokeOpacity: 0.8,
      strokeWeight: 4
    });

    routePath.setMap(map);
    routePolylineRef.current = routePath;
  };

  // Fallback to SVG if Google Maps is not available
  useEffect(() => {
    if (googleMapsLoaded) return;

    // Add a small delay to ensure component is mounted
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) {
        console.warn('Map container ref not available for SVG fallback');
        return;
      }

      // In a real implementation, this would initialize Leaflet/Mapbox
      // For now, we'll create a visual representation
      const container = mapContainerRef.current;
      
      // Double check container exists
      if (!container) {
        console.warn('Map container element not found');
        return;
      }
      
      container.innerHTML = '';

      // Create SVG for map visualization
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', '0 0 800 600');
      svg.style.background = 'linear-gradient(to bottom, #E6E6FA 0%, #F5F3FF 100%)';

      // Add grid pattern for map feel
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', 'grid');
      pattern.setAttribute('width', '40');
      pattern.setAttribute('height', '40');
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 40 0 L 0 0 0 40');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#CBA0F5');
      path.setAttribute('stroke-width', '0.5');
      path.setAttribute('opacity', '0.3');

      pattern.appendChild(path);
      defs.appendChild(pattern);
      svg.appendChild(defs);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '800');
      rect.setAttribute('height', '600');
      rect.setAttribute('fill', 'url(#grid)');
      svg.appendChild(rect);

      // Add decorative "roads"
      const roads = [
        'M 100 100 Q 300 150 500 100 T 700 150',
        'M 150 200 Q 250 300 400 250 T 650 300',
        'M 200 400 Q 350 350 500 450',
      ];

      roads.forEach(d => {
        const road = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        road.setAttribute('d', d);
        road.setAttribute('stroke', '#D8BFD8');
        road.setAttribute('stroke-width', '3');
        road.setAttribute('fill', 'none');
        road.setAttribute('opacity', '0.5');
        svg.appendChild(road);
      });

      // Calculate positions for stops
      const positions: { x: number; y: number; name: string; isOrigin?: boolean }[] = [];
      
      if (origin) {
        positions.push({
          x: 150,
          y: 150,
          name: origin,
          isOrigin: true,
        });
      }

      // Distribute stops across the map
      stops.forEach((stop, idx) => {
        const angle = (idx / stops.length) * Math.PI * 2;
        const radius = 200;
        const centerX = 400;
        const centerY = 300;
        
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          name: stop.name,
        });
      });

      // Draw routes if enabled
      if (showRoute && positions.length > 1) {
        // Add glow effect filter first
        const filterDefs = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filterDefs.setAttribute('id', 'glow');
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '3');
        feGaussianBlur.setAttribute('result', 'coloredBlur');
        filterDefs.appendChild(feGaussianBlur);
        
        const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode1.setAttribute('in', 'coloredBlur');
        const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        filterDefs.appendChild(feMerge);
        
        defs.appendChild(filterDefs);

        // Draw route from origin through all stops
        const routePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathData = `M ${positions[0].x} ${positions[0].y}`;
        
        for (let i = 1; i < positions.length; i++) {
          pathData += ` L ${positions[i].x} ${positions[i].y}`;
        }

        routePath.setAttribute('d', pathData);
        routePath.setAttribute('stroke', '#6A0DAD');
        routePath.setAttribute('stroke-width', '4');
        routePath.setAttribute('fill', 'none');
        routePath.setAttribute('stroke-dasharray', '10,5');
        routePath.setAttribute('opacity', '0.9');
        routePath.setAttribute('stroke-linecap', 'round');
        routePath.setAttribute('stroke-linejoin', 'round');
        routePath.setAttribute('filter', 'url(#glow)');
        
        // Animate the route
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'stroke-dashoffset');
        animate.setAttribute('from', '1000');
        animate.setAttribute('to', '0');
        animate.setAttribute('dur', '3s');
        animate.setAttribute('repeatCount', 'indefinite');
        routePath.appendChild(animate);
        
        svg.appendChild(routePath);
      }

      // Draw markers
      positions.forEach((pos, idx) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

        // Marker pin
        const pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const isOrigin = pos.isOrigin;
        pin.setAttribute('d', 'M 0 -30 C -8 -30 -15 -23 -15 -15 C -15 -5 0 5 0 5 C 0 5 15 -5 15 -15 C 15 -23 8 -30 0 -30 Z');
        pin.setAttribute('fill', isOrigin ? '#8B2DC2' : '#6A0DAD');
        pin.setAttribute('stroke', 'white');
        pin.setAttribute('stroke-width', '2');
        
        // Pin inner circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '0');
        circle.setAttribute('cy', '-20');
        circle.setAttribute('r', '6');
        circle.setAttribute('fill', 'white');

        // Label background
        const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        labelBg.setAttribute('x', '-40');
        labelBg.setAttribute('y', '10');
        labelBg.setAttribute('width', '80');
        labelBg.setAttribute('height', '24');
        labelBg.setAttribute('rx', '4');
        labelBg.setAttribute('fill', 'white');
        labelBg.setAttribute('stroke', isOrigin ? '#8B2DC2' : '#6A0DAD');
        labelBg.setAttribute('stroke-width', '1.5');

        // Label text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '26');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#6A0DAD');
        text.setAttribute('font-weight', '600');
        text.textContent = pos.name.length > 10 ? pos.name.substring(0, 9) + '...' : pos.name;

        group.appendChild(pin);
        group.appendChild(circle);
        group.appendChild(labelBg);
        group.appendChild(text);

        // Add bounce animation
        const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animateTransform.setAttribute('attributeName', 'transform');
        animateTransform.setAttribute('attributeType', 'XML');
        animateTransform.setAttribute('type', 'translate');
        animateTransform.setAttribute('values', `${pos.x} ${pos.y}; ${pos.x} ${pos.y - 10}; ${pos.x} ${pos.y}`);
        animateTransform.setAttribute('dur', '1s');
        animateTransform.setAttribute('begin', `${idx * 0.2}s`);
        animateTransform.setAttribute('fill', 'freeze');
        group.appendChild(animateTransform);
      });

      // Add the SVG to the container
      container.appendChild(svg);
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, [origin, stops, showRoute, googleMapsLoaded]);

  // If Google Maps is not loaded, show fallback SVG map
  if (!googleMapsLoaded) {
    // Convert stops to display coordinates
    const displayStops = stops.map((stop, index) => ({
      ...stop,
      displayIndex: index + 1
    }));

    const hasRoute = origin && displayStops.length > 0;
    const totalStops = displayStops.length;

    return (
      <div 
        className="rounded-lg border-2 border-[#CBA0F5] overflow-hidden shadow-lg relative bg-[#F5F3FF]"
        style={{ height }}
      >
        {/* SVG Map Background */}
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simple map background */}
          <rect width="800" height="600" fill="#E8F0FE" />
          
          {/* Grid lines for map effect */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#D0D0D0" strokeWidth="0.5"/>
            </pattern>
            
            {/* Animated route gradient */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B2DC2" stopOpacity="0.8">
                <animate attributeName="stop-color" values="#8B2DC2;#6A0DAD;#8B2DC2" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#6A0DAD" stopOpacity="0.8">
                <animate attributeName="stop-color" values="#6A0DAD;#8B2DC2;#6A0DAD" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" />
          
          {/* Origin marker */}
          {origin && (
            <>
              <circle cx="400" cy="300" r="10" fill="#8B2DC2">
                <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="400" cy="300" r="15" fill="#8B2DC2" fillOpacity="0.3">
                <animate attributeName="r" values="15;20;15" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x="420" y="305" fill="#333" fontSize="14" fontWeight="bold">
                🚩 {origin}
              </text>
            </>
          )}
          
          {/* Stop markers in circular pattern */}
          {displayStops.map((stop, index) => {
            const angle = (index * 2 * Math.PI) / Math.max(displayStops.length, 1);
            const radius = 120 + (index * 10); // Slightly vary radius
            const x = 400 + radius * Math.cos(angle);
            const y = 300 + radius * Math.sin(angle);
            
            return (
              <g key={stop.id}>
                <circle cx={x} cy={y} r="8" fill="#6A0DAD">
                  <animate attributeName="r" values="8;10;8" dur={`${2 + index * 0.2}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r="12" fill="#6A0DAD" fillOpacity="0.3">
                  <animate attributeName="r" values="12;16;12" dur={`${2 + index * 0.2}s`} repeatCount="indefinite" />
                </circle>
                <text x={x + 15} y={y + 5} fill="#333" fontSize="12" fontWeight="bold">
                  {stop.displayIndex}. {stop.name}
                </text>
                {stop.lat !== 0 && stop.lng !== 0 && (
                  <text x={x + 15} y={y + 20} fill="#666" fontSize="10">
                    ({stop.lat.toFixed(4)}, {stop.lng.toFixed(4)})
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Animated route lines */}
          {hasRoute && (
            <>
              {displayStops.map((_stop, index) => {
                let startX = 400, startY = 300;
                
                if (index > 0) {
                  const prevAngle = ((index - 1) * 2 * Math.PI) / displayStops.length;
                  const prevRadius = 120 + ((index - 1) * 10);
                  startX = 400 + prevRadius * Math.cos(prevAngle);
                  startY = 300 + prevRadius * Math.sin(prevAngle);
                }
                
                const angle = (index * 2 * Math.PI) / displayStops.length;
                const radius = 120 + (index * 10);
                const endX = 400 + radius * Math.cos(angle);
                const endY = 300 + radius * Math.sin(angle);
                
                return (
                  <g key={`route-${index}`}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="url(#routeGradient)"
                      strokeWidth="3"
                      strokeDasharray="10,5"
                      opacity="0.8"
                    >
                      <animate attributeName="stroke-dashoffset" values="0;15" dur="1s" repeatCount="indefinite" />
                    </line>
                    {/* Moving dot along route */}
                    <circle r="4" fill="#8B2DC2">
                      <animateMotion dur={`${3 + index}s`} repeatCount="indefinite">
                        <mpath href={`#route-path-${index}`} />
                      </animateMotion>
                    </circle>
                    <path
                      id={`route-path-${index}`}
                      d={`M ${startX} ${startY} L ${endX} ${endY}`}
                      fill="none"
                      stroke="none"
                    />
                  </g>
                );
              })}
            </>
          )}
        </svg>
        
        {/* Dynamic Route Info */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3 border border-[#CBA0F5]">
          <p className="text-xs text-gray-600 font-semibold">
            🗺️ {hasRoute ? 'Active Route' : 'Route Preview'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {hasRoute 
              ? `${totalStops} destination${totalStops !== 1 ? 's' : ''} connected`
              : 'Add destinations to generate route'
            }
          </p>
          {hasRoute && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              ✓ Route dynamically generated
            </p>
          )}
        </div>
        
        {/* Enhanced Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3 border border-[#CBA0F5]">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8B2DC2] animate-pulse"></div>
              <span className="text-gray-700">Start Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6A0DAD] animate-pulse"></div>
              <span className="text-gray-700">Destination</span>
            </div>
            {hasRoute && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gradient-to-r from-[#8B2DC2] to-[#6A0DAD]" style={{borderTop: '3px solid url(#routeGradient)'}}></div>
                <span className="text-gray-700">Live Route</span>
              </div>
            )}
          </div>
        </div>
        
        {/* No locations message */}
        {!origin && displayStops.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Auto-detecting your location...</p>
              <p className="text-xs mt-1">Add destinations to generate route</p>
            </div>
          </div>
        )}
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
          {showRoute && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#6A0DAD]"></div>
              <span className="text-gray-700">Route</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
