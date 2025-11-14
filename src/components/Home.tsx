import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, Plus, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import { LocationInput } from './LocationInput';
import { MapView } from './MapView';
import { toast } from 'sonner';
import { calculateDistance, estimateTravelTime, calculateFare } from '../utils/distance';
import { validateCoordinates, getCurrentPosition } from '../utils/geocoding';
import type { Stop, OptimizedRoute } from '../App';
import type { PlaceDetails } from '../utils/placesAutocomplete';

interface HomeProps {
  onRouteGenerated: (route: OptimizedRoute) => void;
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

export function Home({ onRouteGenerated }: HomeProps) {
  const [origin, setOrigin] = useState<string>('');
  const [originDetails, setOriginDetails] = useState<PlaceDetails | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<OptimizedRoute | null>(null);

  // Auto-detect current location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Set origin as current location
        setOrigin('Current Location');
        setOriginDetails({
          place_id: 'current_location',
          name: 'Current Location',
          formatted_address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
          geometry: { location: { lat: latitude, lng: longitude } },
          types: ['establishment']
        });
        
        toast.success(' Current location detected');
      } catch (error) {
        console.error('Location detection failed:', error);
        toast.info(' Please enter your starting location');
      }
    };
    
    detectLocation();
  }, []);

  // Add a new stop
  const addStop = () => {
    const newStop: Stop = {
      id: `stop_${Date.now()}`,
      name: '',
      lat: 0,
      lng: 0
    };
    setStops([...stops, newStop]);
  };

  // Remove a stop
  const removeStop = (id: string) => {
    setStops(stops.filter(stop => stop.id !== id));
  };

  // Update stop details
  const updateStop = (id: string, details: PlaceDetails) => {
    setStops(stops.map(stop => 
      stop.id === id 
        ? { ...stop, name: details.name, lat: details.geometry.location.lat, lng: details.geometry.location.lng }
        : stop
    ));
  };

  // Generate simple route based on input order
  const generateRoute = async () => {
    if (!origin || !originDetails) {
      toast.error('Please enter a starting location');
      return;
    }

    if (stops.length === 0) {
      toast.error('Please add at least one destination');
      return;
    }

    // Check if all stops have valid coordinates
    const invalidStops = stops.filter(stop => !stop.lat || !stop.lng || !validateCoordinates(stop.lat, stop.lng));
    if (invalidStops.length > 0) {
      toast.error('Please select valid locations for all destinations');
      return;
    }

    setIsGeneratingRoute(true);

    try {
      // Create journey points in the order user entered
      const journeyPoints = [
        { name: origin, lat: originDetails.geometry.location.lat, lng: originDetails.geometry.location.lng },
        ...stops.map(stop => ({ name: stop.name, lat: stop.lat, lng: stop.lng }))
      ];

      // Calculate simple route metrics
      let totalDistance = 0;
      let totalTime = 0;
      let totalCost = 0;

      for (let i = 0; i < journeyPoints.length - 1; i++) {
        const from = journeyPoints[i];
        const to = journeyPoints[i + 1];
        
        const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
        const time = estimateTravelTime(distance, 'auto');
        const cost = calculateFare(distance, 'auto');

        totalDistance += distance;
        totalTime += time;
        totalCost += cost;
      }

      // Create route object
      const route: OptimizedRoute = {
        stops,
        segments: [], // Simplified - not showing detailed segments
        totalDistance: `${totalDistance.toFixed(1)} km`,
        totalCost: Math.round(totalCost),
        totalDuration: formatTime(totalTime),
        algorithm: 'direct'
      };

      setCurrentRoute(route);
      setShowMap(true);
      onRouteGenerated(route);
      
      toast.success(' Route generated successfully!');
      
    } catch (error) {
      console.error('Route generation failed:', error);
      toast.error('Failed to generate route. Please try again.');
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  // Open route in Google Maps
  const openInGoogleMaps = () => {
    if (!originDetails || stops.length === 0) {
      toast.error('Please generate a route first');
      return;
    }

    // Create Google Maps URL with waypoints
    const originCoords = `${originDetails.geometry.location.lat},${originDetails.geometry.location.lng}`;
    const destinationCoords = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${originCoords}&destination=${destinationCoords}`;
    
    // Add intermediate stops as waypoints
    if (stops.length > 1) {
      const waypoints = stops.slice(0, -1).map(stop => `${stop.lat},${stop.lng}`).join('|');
      url += `&waypoints=${waypoints}`;
    }

    // Open in new tab
    window.open(url, '_blank');
    toast.success(' Opening route in Google Maps...');
  };

  return (
    <div className="space-y-6">
      {/* Route Planning Card */}
      <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-[#E6E6FA] shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="w-6 h-6 text-[#6A0DAD]" />
              Plan Your Route
            </h2>
            <p className="text-gray-600 mt-1">Enter your starting point and destinations</p>
          </div>
          <Badge variant="secondary" className="bg-[#F5F3FF] text-[#6A0DAD] border-[#E6E6FA]">
            {stops.length} {stops.length === 1 ? 'Destination' : 'Destinations'}
          </Badge>
        </div>

        {/* Origin Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#8B2DC2]" />
            Starting Point
          </label>
          <LocationInput
            value={origin}
            onChange={(value, details) => {
              setOrigin(value);
              setOriginDetails(details);
            }}
            placeholder="Enter starting location"
            className="w-full"
          />
        </div>

        {/* Destinations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Destinations</label>
            <Button
              onClick={addStop}
              variant="outline"
              size="sm"
              className="border-[#CBA0F5] text-[#6A0DAD] hover:bg-[#F5F3FF]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Destination
            </Button>
          </div>

          {stops.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-[#E6E6FA] rounded-lg">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No destinations added yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Destination" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6A0DAD] text-white flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <LocationInput
                      value={stop.name}
                      onChange={(value, details) => {
                        setStops(stops.map(s => 
                          s.id === stop.id ? { ...s, name: value } : s
                        ));
                        if (details) {
                          updateStop(stop.id, details);
                        }
                      }}
                      placeholder={`Destination ${index + 1}`}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={() => removeStop(stop.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={generateRoute}
            disabled={isGeneratingRoute || !origin || stops.length === 0}
            className="flex-1 bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
          >
            {isGeneratingRoute ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Route...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Generate Route
              </>
            )}
          </Button>

          {currentRoute && (
            <Button
              onClick={openInGoogleMaps}
              variant="outline"
              className="border-[#6A0DAD] text-[#6A0DAD] hover:bg-[#F5F3FF]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          )}
        </div>
      </Card>

      {/* Map View - Only show after route is generated */}
      {showMap && originDetails && (
        <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-4 mb-6 border-[#E6E6FA] shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#6A0DAD]" />
                Route Map
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your route from {origin} to {stops[stops.length - 1]?.name || 'destination'}
              </p>
            </div>
            {currentRoute && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Distance: <span className="font-medium text-gray-900">{currentRoute.totalDistance}</span>
                </span>
                <span className="text-gray-600">
                  Duration: <span className="font-medium text-gray-900">{currentRoute.totalDuration}</span>
                </span>
                <span className="text-gray-600">
                  Cost: <span className="font-medium text-gray-900">₹{currentRoute.totalCost}</span>
                </span>
              </div>
            )}
          </div>
          
          <MapView
            origin={origin}
            stops={stops}
            showRoute={true}
            height="450px"
          />
        </Card>
      )}
    </div>
  );
}
