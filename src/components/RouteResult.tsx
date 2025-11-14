import { useState } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, TrendingUp, Bus, Footprints, Car, Bike, Save, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { MapView } from './MapView';
import { RouteExport } from './RouteExport';
import { toast } from 'sonner';
import { saveRoute } from '../utils/api';
import type { OptimizedRoute } from '../App';

interface RouteResultProps {
  route: OptimizedRoute;
  allRoutes?: OptimizedRoute[];
  onBack: () => void;
}

const getModeIcon = (mode: string) => {
  switch (mode) {
    case 'bus': return <Bus className="w-5 h-5" />;
    case 'walk': return <Footprints className="w-5 h-5" />;
    case 'auto': return <Car className="w-5 h-5" />;
    case 'bike': return <Bike className="w-5 h-5" />;
    default: return <MapPin className="w-5 h-5" />;
  }
};

const getModeColor = (mode: string) => {
  switch (mode) {
    case 'bus': return 'bg-blue-500';
    case 'walk': return 'bg-green-500';
    case 'auto': return 'bg-yellow-500';
    case 'bike': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

export function RouteResult({ route, allRoutes = [], onBack }: RouteResultProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Use actual generated routes or fallback to current route
  const routeOptions = allRoutes.length > 0 ? allRoutes : [route];
  const currentRoute = routeOptions[selectedRouteIndex] || route;

  // Create route type labels based on algorithm
  const getRouteTypeLabel = (algorithm: string) => {
    switch (algorithm) {
      case 'greedy': return 'Original Order';
      case 'nearest-neighbor': return 'Nearest Neighbor';
      case 'tsp-genetic': return 'Optimized (TSP)';
      default: return 'Standard Route';
    }
  };

  const getRouteTypeDescription = (algorithm: string) => {
    switch (algorithm) {
      case 'greedy': return 'Follows your input order';
      case 'nearest-neighbor': return 'Visits nearest locations first';
      case 'tsp-genetic': return 'AI-optimized shortest path';
      default: return 'Standard routing';
    }
  };

  const handleSaveRoute = async () => {
    setIsSaving(true);
    try {
      const origin = route.segments[0]?.from || 'Unknown';
      await saveRoute({
        origin,
        stops: route.stops,
        segments: route.segments,
        totalCost: route.totalCost,
        totalDuration: route.totalDuration,
        totalDistance: route.totalDistance,
        algorithm: route.algorithm,
      });
      setIsSaved(true);
      toast.success('Route saved successfully!');
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-[#CBA0F5] text-[#6A0DAD]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-[#6A0DAD]">
              {getRouteTypeLabel(currentRoute.algorithm)}
              {allRoutes.length > 1 && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({allRoutes.length} options available)
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600">
              {getRouteTypeDescription(currentRoute.algorithm)}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSaveRoute}
          disabled={isSaving || isSaved}
          className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Route'}
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-[#E6E6FA] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#6A0DAD] rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Total Cost</div>
              <div className="text-[#6A0DAD]">₹{currentRoute.totalCost}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-[#E6E6FA] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#CBA0F5] rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Duration</div>
              <div className="text-[#6A0DAD]">{currentRoute.totalDuration}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-[#E6E6FA] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#B57EDC] rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Distance</div>
              <div className="text-[#6A0DAD]">{currentRoute.totalDistance}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive Map */}
      <Card className="p-4 mb-6 border-[#E6E6FA] shadow-md">
        <h3 className="text-[#6A0DAD] mb-4">Route Visualization</h3>
        <MapView 
          origin={currentRoute.segments[0]?.from} 
          stops={currentRoute.stops} 
          showRoute={true} 
          height="400px" 
        />
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="route" className="mb-6">
        <TabsList className="w-full bg-[#E6E6FA] border-[#CBA0F5]">
          <TabsTrigger value="route" className="flex-1 data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            Route Details
          </TabsTrigger>
          <TabsTrigger value="alternatives" className="flex-1 data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            Alternatives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="route" className="mt-6">
          {/* Route Segments */}
          <div className="space-y-4">
            {currentRoute.segments.map((segment, idx) => (
              <Card key={idx} className="p-4 border-[#E6E6FA] hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${getModeColor(segment.mode)} rounded-full flex items-center justify-center text-white shrink-0`}>
                    {getModeIcon(segment.mode)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-[#6A0DAD] text-white">
                        Segment {idx + 1}
                      </Badge>
                      <Badge variant="outline" className="border-[#CBA0F5] text-[#6A0DAD]">
                        {segment.mode.charAt(0).toUpperCase() + segment.mode.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-700">{segment.from}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-700">{segment.to}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Distance</div>
                        <div className="text-gray-700">{segment.distance}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="text-gray-700">{segment.duration}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Cost</div>
                        <div className="text-[#6A0DAD]">
                          {segment.cost === 0 ? 'Free' : `₹${segment.cost}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Reliability</div>
                        <div className="flex items-center gap-2">
                          <Progress value={segment.reliability} className="h-2" />
                          <span className="text-xs text-gray-600">{segment.reliability}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alternatives" className="mt-6">
          <div className="space-y-4">
            {routeOptions.map((routeOption: OptimizedRoute, idx: number) => (
              <Card 
                key={idx} 
                className={`p-5 border-[#E6E6FA] hover:shadow-lg transition-shadow cursor-pointer ${
                  idx === selectedRouteIndex ? 'ring-2 ring-[#6A0DAD] bg-[#F5F3FF]' : ''
                }`}
                onClick={() => setSelectedRouteIndex(idx)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#6A0DAD]" />
                    <h3 className="text-[#6A0DAD]">{getRouteTypeLabel(routeOption.algorithm)}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {idx === 0 && (
                      <Badge className="bg-green-500 text-white">Best Cost</Badge>
                    )}
                    {routeOption.algorithm === 'tsp-genetic' && (
                      <Badge className="bg-blue-500 text-white">AI Optimized</Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{getRouteTypeDescription(routeOption.algorithm)}</p>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Cost</div>
                    <div className="text-[#6A0DAD] font-semibold">₹{routeOption.totalCost}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Time</div>
                    <div className="text-gray-700 font-semibold">{routeOption.totalDuration}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Distance</div>
                    <div className="text-gray-700 font-semibold">{routeOption.totalDistance}</div>
                  </div>
                </div>

                {idx === selectedRouteIndex && (
                  <div className="mt-3 pt-3 border-t border-[#E6E6FA]">
                    <div className="text-xs text-[#6A0DAD] font-medium">✓ Currently Selected Route</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Route Optimization Note */}
      <Card className="p-5 border-[#CBA0F5] bg-gradient-to-r from-[#E6E6FA] to-white">
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {currentRoute.algorithm === 'tsp-genetic' ? '🧠' : 
             currentRoute.algorithm === 'nearest-neighbor' ? '🎯' : '📍'}
          </div>
          <div>
            <h3 className="text-[#6A0DAD] mb-1">
              {getRouteTypeLabel(currentRoute.algorithm)} - Route Optimization
            </h3>
            <p className="text-sm text-gray-600">
              {currentRoute.algorithm === 'tsp-genetic' 
                ? `This route was optimized using a Genetic Algorithm to solve the Traveling Salesman Problem, finding the most efficient path through all ${currentRoute.stops.length} stops.`
                : currentRoute.algorithm === 'nearest-neighbor'
                ? `This route uses the Nearest Neighbor algorithm, visiting the closest unvisited location at each step through ${currentRoute.stops.length} stops.`
                : `This route follows your original input order through ${currentRoute.stops.length} stops, providing a straightforward path without optimization.`
              }
            </p>
            {allRoutes.length > 1 && (
              <p className="text-xs text-[#6A0DAD] mt-2">
                💡 Switch to the "Alternatives" tab to compare {allRoutes.length} different route options.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Route Export & Sharing */}
      <RouteExport route={currentRoute} allRoutes={allRoutes} />
    </div>
  );
}
