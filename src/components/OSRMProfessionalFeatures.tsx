import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Navigation, 
  Route, 
  MapPin,
  Clock,
  Zap,
  Download,
  Share2,
  Settings,
  TrendingUp,
  Activity,
  CheckCircle,
  RotateCcw,
  Target,
  Globe,
  Cpu,
  BarChart3
} from 'lucide-react';
import { 
  getOptimizedTrip, 
  getRoute,
  getRouteAlternatives,
  exportRouteAsGPX,
  generateShareableURL,
  type OSRMCoordinate
} from '../utils/osrmApi';
import { toast } from 'sonner';
import { log } from '../config/env';

interface OSRMProfessionalFeaturesProps {
  coordinates: OSRMCoordinate[];
  onRouteCalculated?: (routeData: any) => void;
  className?: string;
}

interface RouteAlgorithm {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface RouteMetrics {
  distance: number;
  duration: number;
  steps: number;
  waypoints: number;
  efficiency: number;
}

const ROUTE_ALGORITHMS: RouteAlgorithm[] = [
  {
    id: 'osrm-trip',
    name: 'OSRM Trip Optimization',
    description: 'TSP solver with real road networks',
    icon: Target,
    color: 'bg-purple-500'
  },
  {
    id: 'osrm-route',
    name: 'OSRM Direct Route',
    description: 'Fastest path between points',
    icon: Zap,
    color: 'bg-blue-500'
  },
  {
    id: 'osrm-alternatives',
    name: 'Route Alternatives',
    description: 'Multiple route options comparison',
    icon: BarChart3,
    color: 'bg-green-500'
  },
  {
    id: 'osrm-roundtrip',
    name: 'Roundtrip Optimization',
    description: 'Return to origin optimization',
    icon: RotateCcw,
    color: 'bg-orange-500'
  }
];

export function OSRMProfessionalFeatures({ 
  coordinates, 
  onRouteCalculated,
  className = ""
}: OSRMProfessionalFeaturesProps) {
  const [routeResults, setRouteResults] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState<Record<string, boolean>>({});
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  // Calculate routes when coordinates change
  useEffect(() => {
    if (coordinates.length >= 2) {
      calculateAllRoutes();
    }
  }, [coordinates]);

  const calculateAllRoutes = async () => {
    if (coordinates.length < 2) return;

    log('info', '🚀 Starting professional OSRM route calculations', { coordinates: coordinates.length });
    
    const algorithms = ROUTE_ALGORITHMS;
    const results: Record<string, any> = {};
    
    setCalculationProgress(0);
    
    for (let i = 0; i < algorithms.length; i++) {
      const algorithm = algorithms[i];
      setIsCalculating(prev => ({ ...prev, [algorithm.id]: true }));
      
      try {
        let routeData;
        
        switch (algorithm.id) {
          case 'osrm-trip':
            routeData = await getOptimizedTrip(coordinates, {
              steps: true,
              overview: 'full',
              roundtrip: false
            });
            break;
            
          case 'osrm-route':
            if (coordinates.length === 2) {
              routeData = await getRoute(coordinates[0], coordinates[1], {
                steps: true,
                overview: 'full'
              });
            } else {
              // For multiple points, use trip but mark as direct
              routeData = await getOptimizedTrip(coordinates, {
                steps: true,
                overview: 'full',
                roundtrip: false
              });
            }
            break;
            
          case 'osrm-alternatives':
            routeData = await getRouteAlternatives(coordinates);
            break;
            
          case 'osrm-roundtrip':
            if (coordinates.length >= 3) {
              routeData = await getOptimizedTrip(coordinates, {
                steps: true,
                overview: 'full',
                roundtrip: true
              });
            } else {
              routeData = { error: 'Roundtrip requires 3+ destinations' };
            }
            break;
            
          default:
            routeData = { error: 'Unknown algorithm' };
        }
        
        results[algorithm.id] = {
          ...routeData,
          algorithm: algorithm.name,
          calculatedAt: new Date().toISOString()
        };
        
        log('info', `✅ ${algorithm.name} calculation completed`, { 
          distance: (routeData as any).trips?.[0]?.distance || (routeData as any).routes?.[0]?.distance,
          duration: (routeData as any).trips?.[0]?.duration || (routeData as any).routes?.[0]?.duration
        });
        
      } catch (error) {
        log('error', `❌ ${algorithm.name} calculation failed`, error);
        results[algorithm.id] = { 
          error: error instanceof Error ? error.message : 'Calculation failed',
          algorithm: algorithm.name
        };
        toast.error(`${algorithm.name} calculation failed`);
      }
      
      setIsCalculating(prev => ({ ...prev, [algorithm.id]: false }));
      setCalculationProgress(((i + 1) / algorithms.length) * 100);
    }
    
    setRouteResults(results);
    
    // Set the best route as selected
    const bestRoute = findBestRoute(results);
    if (bestRoute) {
      setSelectedRoute(bestRoute);
      calculateMetrics(bestRoute);
      onRouteCalculated?.(bestRoute);
    }
    
    toast.success('All OSRM algorithms completed!');
  };

  const findBestRoute = (results: Record<string, any>) => {
    const validRoutes = Object.entries(results)
      .filter(([_, data]) => !data.error && (data.trips || data.routes || data.length))
      .map(([id, data]) => ({ id, data }));
    
    if (validRoutes.length === 0) return null;
    
    // Find route with best distance/duration ratio
    return validRoutes.reduce((best, current) => {
      const currentRoute = (current.data as any).trips?.[0] || (current.data as any).routes?.[0] || current.data;
      const bestRoute = (best.data as any).trips?.[0] || (best.data as any).routes?.[0] || best.data;
      
      if (!bestRoute) return current;
      if (!currentRoute) return best;
      
      const currentScore = (currentRoute.distance || 0) + ((currentRoute.duration || 0) * 10);
      const bestScore = (bestRoute.distance || 0) + ((bestRoute.duration || 0) * 10);
      
      return currentScore < bestScore ? current : best;
    }).data;
  };

  const calculateMetrics = (routeData: any) => {
    const route = (routeData as any).trips?.[0] || (routeData as any).routes?.[0] || routeData;
    if (!route) return;
    
    const metrics: RouteMetrics = {
      distance: Math.round((route.distance || 0) / 1000 * 100) / 100, // km
      duration: Math.round((route.duration || 0) / 60), // minutes
      steps: route.legs?.reduce((total: number, leg: any) => total + (leg.steps?.length || 0), 0) || 0,
      waypoints: coordinates.length,
      efficiency: Math.round(((route.distance || 0) / (coordinates.length * 1000)) * 100) / 100
    };
    
    setRouteMetrics(metrics);
  };

  const handleExportGPX = async () => {
    if (!selectedRoute) {
      toast.error('No route selected for export');
      return;
    }
    
    try {
      await exportRouteAsGPX(selectedRoute);
      toast.success('Route exported as GPX file!');
    } catch (error) {
      toast.error('Failed to export route');
      log('error', 'GPX export failed', error);
    }
  };

  const handleShareRoute = () => {
    if (!selectedRoute) {
      toast.error('No route selected for sharing');
      return;
    }
    
    try {
      const shareUrl = generateShareableURL(selectedRoute);
      navigator.clipboard.writeText(shareUrl);
      toast.success('Route URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to generate share URL');
      log('error', 'Share URL generation failed', error);
    }
  };

  const getAlgorithmStatus = (algorithmId: string) => {
    if (isCalculating[algorithmId]) return 'calculating';
    if (routeResults[algorithmId]?.error) return 'error';
    if (routeResults[algorithmId]) return 'completed';
    return 'pending';
  };

  const renderAlgorithmCard = (algorithm: RouteAlgorithm) => {
    const status = getAlgorithmStatus(algorithm.id);
    const result = routeResults[algorithm.id];
    const route = result?.trips?.[0] || result?.routes?.[0];
    
    return (
      <Card key={algorithm.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${algorithm.color} text-white`}>
              <algorithm.icon size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{algorithm.name}</h4>
              <p className="text-xs text-muted-foreground">{algorithm.description}</p>
            </div>
          </div>
          
          <Badge variant={
            status === 'completed' ? 'default' :
            status === 'calculating' ? 'secondary' :
            status === 'error' ? 'destructive' : 'outline'
          }>
            {status === 'calculating' ? 'Calculating...' :
             status === 'completed' ? 'Completed' :
             status === 'error' ? 'Error' : 'Pending'}
          </Badge>
        </div>
        
        {status === 'calculating' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="animate-spin" size={16} />
              <span className="text-sm">Optimizing route...</span>
            </div>
            <Progress value={calculationProgress} className="h-2" />
          </div>
        )}
        
        {status === 'completed' && route && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Distance:</span>
              <p className="font-semibold">{(route.distance / 1000).toFixed(1)} km</p>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <p className="font-semibold">{Math.round(route.duration / 60)} min</p>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-sm text-destructive">
            {result?.error || 'Calculation failed'}
          </div>
        )}
        
        {status === 'completed' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={() => {
              setSelectedRoute(result);
              calculateMetrics(result);
            }}
          >
            Select Route
          </Button>
        )}
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 text-white rounded-lg">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">OSRM Professional Features</h2>
              <p className="text-muted-foreground">Advanced route optimization with multiple algorithms</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={calculateAllRoutes}
              disabled={coordinates.length < 2}
            >
              <RotateCcw size={16} className="mr-2" />
              Recalculate
            </Button>
          </div>
        </div>
        
        {routeMetrics && (
          <div className="grid grid-cols-5 gap-4 text-center">
            <div className="bg-white/60 rounded-lg p-3">
              <Route size={20} className="mx-auto mb-1 text-purple-600" />
              <p className="text-sm font-semibold">{routeMetrics.distance} km</p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <Clock size={20} className="mx-auto mb-1 text-blue-600" />
              <p className="text-sm font-semibold">{routeMetrics.duration} min</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <Navigation size={20} className="mx-auto mb-1 text-green-600" />
              <p className="text-sm font-semibold">{routeMetrics.steps}</p>
              <p className="text-xs text-muted-foreground">Turn Steps</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <MapPin size={20} className="mx-auto mb-1 text-orange-600" />
              <p className="text-sm font-semibold">{routeMetrics.waypoints}</p>
              <p className="text-xs text-muted-foreground">Waypoints</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <TrendingUp size={20} className="mx-auto mb-1 text-red-600" />
              <p className="text-sm font-semibold">{routeMetrics.efficiency}</p>
              <p className="text-xs text-muted-foreground">Efficiency</p>
            </div>
          </div>
        )}
      </Card>

      {/* Algorithm Comparison */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={20} className="text-purple-600" />
          <h3 className="text-lg font-semibold">Algorithm Comparison</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROUTE_ALGORITHMS.map(renderAlgorithmCard)}
        </div>
      </Card>

      {/* Export and Sharing */}
      {selectedRoute && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download size={20} className="text-green-600" />
            <h3 className="text-lg font-semibold">Export & Sharing</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleExportGPX} className="flex items-center gap-2">
              <Download size={16} />
              Export GPX File
            </Button>
            
            <Button variant="outline" onClick={handleShareRoute} className="flex items-center gap-2">
              <Share2 size={16} />
              Share Route URL
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Selected Route Details:</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle size={16} className="text-green-600" />
                Algorithm: {selectedRoute.algorithm}
              </span>
              <span className="flex items-center gap-1">
                <Globe size={16} className="text-blue-600" />
                Real Road Networks
              </span>
              <span className="flex items-center gap-1">
                <Zap size={16} className="text-yellow-600" />
                TSP Optimized
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
