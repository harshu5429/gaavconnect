import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { OSRMProfessionalFeatures } from './OSRMProfessionalFeatures';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, Plus, Navigation, Sparkles, Loader2, Route, Clock, DollarSign } from 'lucide-react';
import { LocationInput } from './LocationInput';
import { MapView } from './MapView';
import { SegmentDetails } from './SegmentDetails';
import { RouteOptimizationLoader } from './LoadingSpinner';
import { MultiCoordinateSelector } from './MultiCoordinateSelector';
import { toast } from 'sonner';
import { calculateDistance, estimateTravelTime, calculateFare } from '../utils/distance';
import { solveTSP, nearestNeighborTSP } from '../utils/tspSolver';
import { reverseGeocode, getCurrentPosition, calculateRealTimeDistance, validateCoordinates } from '../utils/geocoding';
import { getOptimizedTrip, formatDistance, formatDuration, type OSRMCoordinate } from '../utils/osrmApi';
import type { Stop, OptimizedRoute } from '../App';
import type { PlaceDetails } from '../utils/placesAutocomplete';

interface HomeProps {
  onRouteGenerated: (route: OptimizedRoute, allRoutes?: OptimizedRoute[]) => void;
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (mins > 0) {
    return `${mins}m`;
  }
  return '0m';
};

// Generate route segments from ordered points with real-time distance calculation
const generateRouteSegments = (journeyPoints: Array<{name: string, lat: number, lng: number}>, mode: 'walk' | 'bus' | 'auto' | 'bike' = 'auto') => {
  const segments = [];
  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;

  for (let i = 0; i < journeyPoints.length - 1; i++) {
    const from = journeyPoints[i];
    const to = journeyPoints[i + 1];

    // Use real-time distance calculation with validation
    if (!validateCoordinates(from.lat, from.lng) || !validateCoordinates(to.lat, to.lng)) {
      console.warn(`Invalid coordinates detected: ${from.name} -> ${to.name}`);
      continue;
    }

    const distance = calculateRealTimeDistance(from.lat, from.lng, to.lat, to.lng);
    const time = estimateTravelTime(distance, mode);
    const cost = calculateFare(distance, mode);

    totalDistance += distance;
    totalTime += time;
    totalCost += cost;

    segments.push({
      mode,
      from: from.name,
      to: to.name,
      distance: `${distance.toFixed(2)} km`, // Higher precision for real-time data
      duration: formatTime(time),
      cost,
      reliability: mode === 'auto' ? 85 : mode === 'bus' ? 75 : mode === 'bike' ? 90 : 95,
    });
  }

  return { segments, totalDistance, totalTime, totalCost };
};

// Generate multiple optimized routes using different algorithms
const generateMultipleRoutes = async (
  origin: string, 
  originDetails: PlaceDetails | null, 
  stops: Stop[]
): Promise<OptimizedRoute[]> => {
  const routes: OptimizedRoute[] = [];
  
  // Create journey points array
  const originPoint = {
    name: origin,
    lat: originDetails?.geometry.location.lat || 17.3850,
    lng: originDetails?.geometry.location.lng || 78.4867,
  };
  
  const allPoints = [originPoint, ...stops];
  
  // If only 2 points (origin + 1 stop), create simple routes with different modes
  if (stops.length === 1) {
    const modes: Array<'auto' | 'bus' | 'bike'> = ['auto', 'bus', 'bike'];
    
    modes.forEach((mode, index) => {
      const { segments, totalDistance, totalTime, totalCost } = generateRouteSegments(allPoints, mode);
      
      routes.push({
        stops,
        segments,
        totalDistance: `${totalDistance.toFixed(1)} km`,
        totalCost: Math.round(totalCost),
        totalDuration: formatTime(totalTime),
        algorithm: index === 0 ? 'greedy' : index === 1 ? 'nearest-neighbor' : 'tsp-genetic',
      });
    });
  } else {
    // For multiple stops, use enhanced TSP optimization with real-time distances
    const coordinates = allPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    
    // Create real-time distance matrix with comprehensive validation
    const realTimeDistanceMatrix: number[][] = [];
    
    console.log('🔍 Creating distance matrix for', coordinates.length, 'points');
    
    for (let i = 0; i < coordinates.length; i++) {
      realTimeDistanceMatrix[i] = [];
      for (let j = 0; j < coordinates.length; j++) {
        if (i === j) {
          realTimeDistanceMatrix[i][j] = 0;
        } else {
          const coord1 = coordinates[i];
          const coord2 = coordinates[j];
          
          // Validate coordinates exist and are valid
          if (!coord1 || !coord2 || 
              typeof coord1.lat !== 'number' || typeof coord1.lng !== 'number' ||
              typeof coord2.lat !== 'number' || typeof coord2.lng !== 'number') {
            console.warn(`Invalid coordinates at [${i}][${j}]:`, coord1, coord2);
            realTimeDistanceMatrix[i][j] = 999; // Large distance for invalid coordinates
            continue;
          }
          
          if (validateCoordinates(coord1.lat, coord1.lng) && validateCoordinates(coord2.lat, coord2.lng)) {
            try {
              const distance = calculateRealTimeDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
              realTimeDistanceMatrix[i][j] = distance;
            } catch (error) {
              console.warn(`Error calculating distance [${i}][${j}]:`, error);
              // Fallback to standard calculation
              realTimeDistanceMatrix[i][j] = calculateDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
            }
          } else {
            console.warn(`Invalid coordinate bounds [${i}][${j}]:`, coord1, coord2);
            // Fallback to standard calculation
            realTimeDistanceMatrix[i][j] = calculateDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
          }
        }
      }
    }
    
    // Validate the complete matrix
    console.log('📊 Distance matrix created:', realTimeDistanceMatrix);
    
    // Check for any undefined or invalid values
    for (let i = 0; i < realTimeDistanceMatrix.length; i++) {
      for (let j = 0; j < realTimeDistanceMatrix[i].length; j++) {
        if (typeof realTimeDistanceMatrix[i][j] !== 'number' || isNaN(realTimeDistanceMatrix[i][j])) {
          console.error(`Invalid distance at [${i}][${j}]:`, realTimeDistanceMatrix[i][j]);
          realTimeDistanceMatrix[i][j] = 999; // Set to large distance
        }
      }
    }
    
    // Route 1: Greedy/Original order
    const { segments: greedySegments, totalDistance: greedyDist, totalTime: greedyTime, totalCost: greedyCost } = 
      generateRouteSegments(allPoints, 'auto');
    
    routes.push({
      stops,
      segments: greedySegments,
      totalDistance: `${greedyDist.toFixed(2)} km`,
      totalCost: Math.round(greedyCost),
      totalDuration: formatTime(greedyTime),
      algorithm: 'greedy',
    });
    
    // Route 2: Nearest Neighbor TSP (with error handling)
    try {
      console.log('🎯 Running Nearest Neighbor TSP...');
      const nnSolution = nearestNeighborTSP(realTimeDistanceMatrix);
      const nnOrderedPoints = nnSolution.route.map(index => allPoints[index]);
      const { segments: nnSegments, totalDistance: nnDist, totalTime: nnTime, totalCost: nnCost } = 
        generateRouteSegments(nnOrderedPoints, 'auto');
      
      routes.push({
        stops: nnSolution.route.slice(1).map(index => stops[index - 1]), // Remove origin, adjust indices
        segments: nnSegments,
        totalDistance: `${nnDist.toFixed(2)} km`,
        totalCost: Math.round(nnCost),
        totalDuration: formatTime(nnTime),
        algorithm: 'nearest-neighbor',
      });
    } catch (error) {
      console.error('❌ Nearest Neighbor TSP failed:', error);
      // Continue without nearest neighbor route
    }
    
    // Route 3: Enhanced Genetic Algorithm TSP (with error handling)
    try {
      console.log('🧠 Running TSP Genetic Algorithm...');
      const gaSolution = solveTSP(realTimeDistanceMatrix, { 
        populationSize: Math.max(100, allPoints.length * 15),
        generations: Math.max(200, allPoints.length * 25),
        mutationRate: 0.02,
        eliteSize: Math.ceil(Math.max(100, allPoints.length * 15) * 0.2)
      });
      
      console.log('✅ TSP solution found:', gaSolution);
      
      const gaOrderedPoints = gaSolution.route.map(index => allPoints[index]);
      const { segments: gaSegments, totalDistance: gaDist, totalTime: gaTime, totalCost: gaCost } = 
        generateRouteSegments(gaOrderedPoints, 'auto');
      
      routes.push({
        stops: gaSolution.route.slice(1).map(index => stops[index - 1]), // Remove origin, adjust indices
        segments: gaSegments,
        totalDistance: `${gaDist.toFixed(2)} km`,
        totalCost: Math.round(gaCost),
        totalDuration: formatTime(gaTime),
        algorithm: 'tsp-genetic',
      });
    } catch (error) {
      console.error('❌ TSP Genetic Algorithm failed:', error);
      // Continue without genetic algorithm route
    }

    // Route 4: OSRM Optimized Route (with error handling)
    try {
      console.log('🗺️ Running OSRM Route Optimization...');
      
      const coordinates: OSRMCoordinate[] = allPoints.map(point => ({
        lat: point.lat,
        lng: point.lng
      }));

      // Try both standard and roundtrip optimization
      const osrmTrip = await getOptimizedTrip(coordinates, {
        steps: true,
        overview: 'full',
        roundtrip: false
      });

      if (osrmTrip.trips.length > 0) {
        const trip = osrmTrip.trips[0];
        
        // Convert OSRM waypoints back to stops order
        const osrmOrderedStops = osrmTrip.waypoints
          .slice(1) // Remove origin
          .map((waypoint) => {
            // Find corresponding stop based on coordinates
            const waypointLat = waypoint.location[1]; // OSRM returns [lng, lat]
            const waypointLng = waypoint.location[0];
            
            // Find closest stop to this waypoint
            let closestStop = stops[0];
            let minDistance = Infinity;
            
            stops.forEach(stop => {
              const distance = Math.abs(stop.lat - waypointLat) + Math.abs(stop.lng - waypointLng);
              if (distance < minDistance) {
                minDistance = distance;
                closestStop = stop;
              }
            });
            
            return closestStop;
          });

        // Generate segments for OSRM route
        const osrmOrderedPoints = [originPoint, ...osrmOrderedStops];
        const { segments: osrmSegments, totalCost: osrmCost } = 
          generateRouteSegments(osrmOrderedPoints, 'auto');

        routes.push({
          stops: osrmOrderedStops,
          segments: osrmSegments,
          totalDistance: formatDistance(trip.distance),
          totalCost: Math.round(osrmCost),
          totalDuration: formatDuration(trip.duration),
          algorithm: 'tsp-aco', // Using ACO as identifier for OSRM
        });

        console.log('✅ OSRM route optimization completed');
      }
    } catch (error) {
      console.error('❌ OSRM route optimization failed:', error);
      // Continue without OSRM route
    }
  }
  
  // Ensure we always have at least one route
  if (routes.length === 0) {
    console.warn('⚠️ No routes generated, creating fallback route');
    // Create a basic fallback route
    const { segments: fallbackSegments, totalDistance: fallbackDist, totalTime: fallbackTime, totalCost: fallbackCost } = 
      generateRouteSegments(allPoints, 'auto');
    
    routes.push({
      stops,
      segments: fallbackSegments,
      totalDistance: `${fallbackDist.toFixed(2)} km`,
      totalCost: Math.round(fallbackCost),
      totalDuration: formatTime(fallbackTime),
      algorithm: 'greedy',
    });
  }
  
  console.log('🚀 Generated', routes.length, 'route options');
  return routes;
};

export function Home({ onRouteGenerated }: HomeProps) {
  const [origin, setOrigin] = useState('');
  const [originDetails, setOriginDetails] = useState<PlaceDetails | null>(null);
  const [currentStop, setCurrentStop] = useState('');
  const [currentStopDetails, setCurrentStopDetails] = useState<PlaceDetails | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSegmentDetails, setShowSegmentDetails] = useState(false);
  const segmentDetailsRef = useRef<HTMLDivElement>(null);

  // Real-time location detection with geocoding
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // Get high-accuracy position
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Validate coordinates
      if (!validateCoordinates(latitude, longitude)) {
        throw new Error('Invalid coordinates received');
      }
      
      // Real-time reverse geocoding
      const locationDetails = await reverseGeocode(latitude, longitude);
      
      // Convert to PlaceDetails format
      const realLocation: PlaceDetails = {
        place_id: locationDetails.place_id,
        name: locationDetails.name,
        formatted_address: locationDetails.formatted_address,
        geometry: {
          location: { 
            lat: locationDetails.geometry.location.lat, 
            lng: locationDetails.geometry.location.lng 
          }
        },
        types: locationDetails.types
      };
      
      setOrigin(locationDetails.name);
      setOriginDetails(realLocation);
      setIsGettingLocation(false);
      toast.success(`📍 Location detected: ${locationDetails.name}`);
      
    } catch (error) {
      console.error('Error getting real-time location:', error);
      setIsGettingLocation(false);
      
      // Show specific error message
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable. Please check your GPS.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('Unknown location error occurred.');
        }
      } else {
        toast.error('Failed to get current location. Please enter manually.');
      }
    }
  };

  // Auto-detect location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Scroll to segment details when they become visible
  useEffect(() => {
    if (showSegmentDetails && segmentDetailsRef.current) {
      console.log('🎯 Scrolling to segment details');
      segmentDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showSegmentDetails]);

  const addStop = () => {
    console.log('addStop called');
    console.log('currentStop:', currentStop);
    console.log('currentStopDetails:', currentStopDetails);
    
    if (!currentStop.trim()) {
      console.log('No current stop text');
      toast.error('Please enter a destination');
      return;
    }
    
    if (!currentStopDetails) {
      console.log('No current stop details');
      toast.error('Please select a location from the suggestions');
      return;
    }

    const newStop: Stop = {
      id: Date.now().toString(),
      name: currentStop,
      lat: currentStopDetails.geometry.location.lat || 0,
      lng: currentStopDetails.geometry.location.lng || 0,
    };

    console.log('Adding new stop:', newStop);
    setStops([...stops, newStop]);
    setCurrentStop('');
    setCurrentStopDetails(null);
    toast.success(`Added ${currentStop} to destinations`);
  };

  const removeStop = (stopId: string) => {
    const stop = stops.find(s => s.id === stopId);
    setStops(stops.filter(s => s.id !== stopId));
    if (stop) {
      toast.success(`Removed ${stop.name} from destinations`);
    }
  };

  const updateStop = (stopId: string, updatedStop: Stop) => {
    setStops(stops.map(s => s.id === stopId ? updatedStop : s));
  };

  const generateRoute = async () => {
    if (!origin.trim()) {
      toast.error('Please enter an origin');
      return;
    }

    if (stops.length === 0) {
      toast.error('Please add at least one destination stop');
      return;
    }

    if (!originDetails) {
      toast.error('Please select a valid origin from the suggestions');
      return;
    }

    if (stops.some(s => s.lat === 0 && s.lng === 0)) {
      toast.error('Please select valid locations from the suggestions');
      return;
    }

    setIsOptimizing(true);
    try {
      // Generate multiple optimized routes
      const multipleRoutes = await generateMultipleRoutes(origin, originDetails, stops);
      
      // Select the best route (lowest cost) as default
      const bestRoute = multipleRoutes.reduce((best: OptimizedRoute, current: OptimizedRoute) => 
        current.totalCost < best.totalCost ? current : best
      );

      // Pass the best route and all routes to the parent component
      onRouteGenerated(bestRoute, multipleRoutes);
      
      // Log route comparison for debugging
      console.log('🚀 Generated routes:', multipleRoutes.map(r => ({
        algorithm: r.algorithm,
        cost: r.totalCost,
        duration: r.totalDuration,
        distance: r.totalDistance
      })));
      console.log('✅ Setting showSegmentDetails to true');
      setShowSegmentDetails(true); // Show segment details after route is generated
      toast.success('Route generated successfully!');
    } catch (error) {
      console.error('Error generating route:', error);
      toast.error('Failed to generate route');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl min-h-screen">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h2 className="text-[#6A0DAD] mb-2">Plan Your Journey</h2>
        <p className="text-gray-600">AI-powered route optimization with real-time data</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-green-600 font-medium">Live GPS & Real-time Distance Calculation</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">Enhanced TSP Genetic Algorithm for optimal route planning</p>
      </div>

      {/* Origin Input */}
      <Card className="p-6 mb-6 border-[#E6E6FA] shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="w-5 h-5 text-[#6A0DAD]" />
          <label className="text-[#6A0DAD] font-semibold">Starting Point</label>
          {origin && <Badge className="bg-green-100 text-green-700 ml-auto">✓ Auto-detected</Badge>}
          <Button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            variant="outline"
            size="sm"
            className="ml-2 border-[#CBA0F5] text-[#6A0DAD] hover:bg-[#E6E6FA]"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>
        <LocationInput
          value={origin}
          onChange={(value, placeDetails) => {
            setOrigin(value);
            setOriginDetails(placeDetails || null);
          }}
          placeholder="Current location will be auto-detected..."
          className="w-full"
          disabled={isGettingLocation}
        />
        {originDetails && (
          <div className="mt-2 text-sm text-gray-600">
            📍 Coordinates: {originDetails.geometry.location.lat.toFixed(6)}, {originDetails.geometry.location.lng.toFixed(6)}
          </div>
        )}
      </Card>

      {/* Add Stops */}
      <Card className="p-6 mb-6 border-[#E6E6FA] shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-[#6A0DAD]" />
          <label className="text-[#6A0DAD] font-semibold">Add Destination</label>
          {stops.length > 0 && <Badge className="bg-blue-100 text-blue-700 ml-auto">{stops.length} stops added</Badge>}
        </div>
        
        <div className="mb-4">
          <div className="flex gap-2">
            <LocationInput
              value={currentStop}
              onChange={(value, placeDetails) => {
                setCurrentStop(value);
                setCurrentStopDetails(placeDetails || null);
              }}
              placeholder="Type a Hyderabad destination (e.g., Banjara Hills, Madhapur)"
              className="flex-1"
            />
            <Button
              onClick={addStop}
              disabled={!currentStop.trim() || !currentStopDetails}
              className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          {currentStopDetails && (
            <div className="mt-2 text-sm text-gray-600">
              📍 Coordinates: {currentStopDetails.geometry.location.lat.toFixed(6)}, {currentStopDetails.geometry.location.lng.toFixed(6)}
            </div>
          )}
        </div>

        {/* Enhanced Stops List with Multiple Coordinates */}
        {stops.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Added Destinations ({stops.length}):
            </h4>
            {stops.map((stop) => (
              <MultiCoordinateSelector
                key={stop.id}
                stop={stop}
                onStopUpdate={(updatedStop) => updateStop(stop.id, updatedStop)}
                onRemoveStop={() => removeStop(stop.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Enhanced Map Preview with OSRM Integration */}
      {(origin || stops.length > 0) && (
        <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-4 mb-6 border-[#E6E6FA] shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[#6A0DAD] font-semibold flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                OSRM-Powered Route Map
              </h3>
              <p className="text-sm text-gray-600">
                {stops.length > 0 
                  ? `Professional route optimization with ${stops.length} destination${stops.length !== 1 ? 's' : ''}`
                  : "Add destinations to generate OSRM-optimized routes"
                }
              </p>
            </div>
            {stops.length > 0 && (
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700">
                  🗺️ OSRM Active
                </Badge>
                <Badge className="bg-purple-100 text-purple-700">
                  {stops.length} stop{stops.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>

          {/* OSRM Features Info */}
          {stops.length > 0 && (
            <div className="bg-gradient-to-r from-[#F5F3FF] to-[#E6E6FA] p-3 rounded-lg border border-[#CBA0F5]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#6A0DAD]" />
                <span className="text-sm font-medium text-[#6A0DAD]">OSRM Enhanced Features</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Route className="w-3 h-3" />
                  Real road networks
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Optimized timing
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  TSP optimization
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Turn-by-turn ready
                </div>
              </div>
            </div>
          )}

          <MapView 
            origin={origin} 
            stops={stops} 
            showRoute={stops.length > 0} 
            height="400px" 
          />
          
          {stops.length > 0 && (
            <div className="bg-[#F5F3FF] p-3 rounded-lg border border-[#E6E6FA]">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-[#6A0DAD] rounded-full animate-pulse"></div>
                  Route powered by OSRM API
                </div>
                <div className="text-[#6A0DAD] font-medium">
                  📍 {origin || 'Start'} → {stops.length} destinations
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ✨ Professional-grade routing with real-world road network optimization
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Generate Route Button */}
      <Button
        onClick={generateRoute}
        disabled={isOptimizing || !origin || stops.length === 0}
        className="w-full bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white py-6 text-lg shadow-lg"
      >
        {isOptimizing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            AI Optimizing Routes...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate AI Optimized Routes
          </>
        )}
      </Button>

      {/* AI Optimization Loading Overlay */}
      {isOptimizing && (
        <Card className="p-6 mb-6 border-[#8B2DC2] bg-gradient-to-r from-[#6A0DAD] to-[#8B2DC2] text-white">
          <RouteOptimizationLoader />
        </Card>
      )}

      {/* Route Summary - Total Cost, Duration, Distance */}
      {stops.length > 0 && (
        <Card className="p-6 mb-6 border-[#8B2DC2] bg-gradient-to-r from-[#6A0DAD] to-[#8B2DC2] text-white shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-6 h-6" />
            <h3 className="text-xl font-bold">Route Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Total Distance */}
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <MapPin className="w-6 h-6 mb-2 text-[#CBA0F5]" />
              <p className="text-sm text-purple-100 mb-1">Total Distance</p>
              <p className="text-3xl font-bold">
                {(() => {
                  let totalDist = 0;
                  // Origin to first stop (real-time calculation)
                  if (stops.length > 0 && originDetails) {
                    const originLat = originDetails.geometry.location.lat;
                    const originLng = originDetails.geometry.location.lng;
                    if (validateCoordinates(originLat, originLng) && validateCoordinates(stops[0].lat, stops[0].lng)) {
                      totalDist += calculateRealTimeDistance(originLat, originLng, stops[0].lat, stops[0].lng);
                    }
                  }
                  // Between consecutive stops (real-time calculation)
                  for (let i = 0; i < stops.length - 1; i++) {
                    if (validateCoordinates(stops[i].lat, stops[i].lng) && validateCoordinates(stops[i + 1].lat, stops[i + 1].lng)) {
                      totalDist += calculateRealTimeDistance(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
                    }
                  }
                  return totalDist.toFixed(2);
                })()}
              </p>
              <p className="text-sm text-purple-100">km</p>
            </div>

            {/* Total Duration */}
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <Clock className="w-6 h-6 mb-2 text-[#CBA0F5]" />
              <p className="text-sm text-purple-100 mb-1">Total Duration</p>
              <p className="text-3xl font-bold">
                {(() => {
                  let totalTime = 0;
                  // Origin to first stop (real-time calculation)
                  if (stops.length > 0 && originDetails) {
                    const originLat = originDetails.geometry.location.lat;
                    const originLng = originDetails.geometry.location.lng;
                    if (validateCoordinates(originLat, originLng) && validateCoordinates(stops[0].lat, stops[0].lng)) {
                      const dist1 = calculateRealTimeDistance(originLat, originLng, stops[0].lat, stops[0].lng);
                      totalTime += estimateTravelTime(dist1, 'auto');
                    }
                  }
                  // Between consecutive stops (real-time calculation)
                  for (let i = 0; i < stops.length - 1; i++) {
                    if (validateCoordinates(stops[i].lat, stops[i].lng) && validateCoordinates(stops[i + 1].lat, stops[i + 1].lng)) {
                      const dist = calculateRealTimeDistance(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
                      totalTime += estimateTravelTime(dist, 'auto');
                    }
                  }
                  return formatTime(totalTime);
                })()}
              </p>
            </div>

            {/* Total Cost */}
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <DollarSign className="w-6 h-6 mb-2 text-[#CBA0F5]" />
              <p className="text-sm text-purple-100 mb-1">Estimated Cost</p>
              <p className="text-3xl font-bold">
                ₹
                {(() => {
                  let totalCost = 0;
                  // Origin to first stop (real-time calculation)
                  if (stops.length > 0 && originDetails) {
                    const originLat = originDetails.geometry.location.lat;
                    const originLng = originDetails.geometry.location.lng;
                    if (validateCoordinates(originLat, originLng) && validateCoordinates(stops[0].lat, stops[0].lng)) {
                      const dist1 = calculateRealTimeDistance(originLat, originLng, stops[0].lat, stops[0].lng);
                      totalCost += calculateFare(dist1, 'auto');
                    }
                  }
                  // Between consecutive stops (real-time calculation)
                  for (let i = 0; i < stops.length - 1; i++) {
                    if (validateCoordinates(stops[i].lat, stops[i].lng) && validateCoordinates(stops[i + 1].lat, stops[i + 1].lng)) {
                      const dist = calculateRealTimeDistance(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
                      totalCost += calculateFare(dist, 'auto');
                    }
                  }
                  return Math.round(totalCost);
                })()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Distance Between Points Card */}
      {stops.length > 0 && (
        <Card className="p-6 mb-6 border-[#CBA0F5] bg-gradient-to-r from-[#E6E6FA] to-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#6A0DAD]" />
            <h3 className="text-lg font-bold text-[#6A0DAD]">Distance & Time Between Points</h3>
          </div>
          <div className="space-y-3">
            {/* Origin to first stop */}
            {stops.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-[#6A0DAD] hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{origin} → {stops[0].name}</p>
                  <p className="text-sm text-gray-500">Starting point to first destination</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#6A0DAD]">
                    {calculateDistance(
                      originDetails?.geometry.location.lat || 17.3850,
                      originDetails?.geometry.location.lng || 78.4867,
                      stops[0].lat,
                      stops[0].lng
                    ).toFixed(1)} km
                  </p>
                  <p className="text-sm text-gray-600">
                    ⏱️ {formatTime(estimateTravelTime(
                      calculateDistance(
                        originDetails?.geometry.location.lat || 17.3850,
                        originDetails?.geometry.location.lng || 78.4867,
                        stops[0].lat,
                        stops[0].lng
                      ),
                      'auto'
                    ))}
                  </p>
                </div>
              </div>
            )}
            
            {/* Between consecutive stops */}
            {stops.map((stop, index) => {
              if (index === stops.length - 1) return null; // Skip last stop
              const nextStop = stops[index + 1];
              const distance = calculateDistance(stop.lat, stop.lng, nextStop.lat, nextStop.lng);
              const time = estimateTravelTime(distance, 'auto');
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-[#8B2DC2] hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Stop {index + 1} → Stop {index + 2}</p>
                    <p className="text-sm text-gray-500">{stop.name} to {nextStop.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#6A0DAD]">{distance.toFixed(1)} km</p>
                    <p className="text-sm text-gray-600">⏱️ {formatTime(time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Segment Details with Distance and Time - shown only after Generate Route button is clicked */}
      {showSegmentDetails && stops.length > 0 && (
        <div ref={segmentDetailsRef} className="mt-8 pt-8 border-t-2 border-[#E6E6FA] animate-fadeIn">
          <SegmentDetails 
            origin={origin}
            originDetails={originDetails}
            stops={stops}
          />
        </div>
      )}

      {/* OSRM Professional Features - Advanced Route Optimization */}
      {stops.length >= 2 && (
        <div className="mt-8 pt-8 border-t-2 border-[#E6E6FA]">
          <OSRMProfessionalFeatures
            coordinates={[
              ...(originDetails ? [{
                lat: originDetails.geometry.location.lat,
                lng: originDetails.geometry.location.lng
              }] : []),
              ...stops.map(stop => ({
                lat: stop.lat,
                lng: stop.lng
              }))
            ]}
            onRouteCalculated={(routeData) => {
              console.log('OSRM Professional Route Calculated:', routeData);
              toast.success('Professional OSRM route optimization completed!');
            }}
            className="animate-fadeIn"
          />
        </div>
      )}
    </div>
  );
}
