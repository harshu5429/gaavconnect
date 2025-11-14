import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Navigation, 
  Route, 
  Sparkles, 
  TrendingUp,
  Zap,
  Globe,
  Activity,
  CheckCircle
} from 'lucide-react';
import { getRouteSummary, type OSRMCoordinate } from '../utils/osrmApi';
import { toast } from 'sonner';

interface OSRMIntegrationCardProps {
  coordinates: OSRMCoordinate[];
  title?: string;
  description?: string;
  showMetrics?: boolean;
  showFeatures?: boolean;
  className?: string;
  onRouteCalculated?: (routeData: any) => void;
}

export function OSRMIntegrationCard({ 
  coordinates, 
  title = "OSRM Route Integration",
  description = "Professional route optimization powered by OSRM",
  showMetrics = true,
  showFeatures = true,
  className = "",
  onRouteCalculated
}: OSRMIntegrationCardProps) {
  const [routeData, setRouteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Calculate route when coordinates change
  useEffect(() => {
    if (coordinates.length >= 2) {
      calculateRoute();
    }
  }, [coordinates]);

  const calculateRoute = async () => {
    if (coordinates.length < 2) return;

    setIsLoading(true);
    try {
      const summary = await getRouteSummary(coordinates);
      setRouteData(summary);
      setIsActive(true);
      onRouteCalculated?.(summary);
      toast.success('OSRM route calculated successfully');
    } catch (error) {
      console.error('OSRM route calculation failed:', error);
      toast.error('Failed to calculate OSRM route');
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Route className="w-4 h-4" />,
      label: "Real Road Networks",
      description: "Uses actual road data"
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "TSP Optimization",
      description: "Solves traveling salesman problem"
    },
    {
      icon: <Navigation className="w-4 h-4" />,
      label: "Turn-by-Turn",
      description: "Detailed navigation instructions"
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: "Global Coverage",
      description: "Worldwide routing support"
    }
  ];

  return (
    <Card className={`bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-4 mb-6 border-[#E6E6FA] shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#6A0DAD] font-semibold flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={`${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {isActive ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                OSRM Active
              </>
            ) : (
              <>
                <Activity className="w-3 h-3 mr-1" />
                Standby
              </>
            )}
          </Badge>
          {coordinates.length > 0 && (
            <Badge className="bg-purple-100 text-purple-700">
              {coordinates.length} points
            </Badge>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-gradient-to-r from-[#F5F3FF] to-[#E6E6FA] p-4 rounded-lg border border-[#CBA0F5]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#6A0DAD] border-t-transparent rounded-full animate-spin"></div>
            <div>
              <div className="font-medium text-[#6A0DAD]">Calculating OSRM Route...</div>
              <div className="text-sm text-gray-600">Optimizing {coordinates.length} waypoints</div>
            </div>
          </div>
        </div>
      )}

      {/* Route Metrics */}
      {showMetrics && routeData && !isLoading && (
        <div className="bg-gradient-to-r from-[#F5F3FF] to-[#E6E6FA] p-4 rounded-lg border border-[#CBA0F5]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#6A0DAD]" />
            <span className="font-medium text-[#6A0DAD]">Route Metrics</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-[#6A0DAD]">{routeData.distance}</div>
              <div className="text-xs text-gray-600">Total Distance</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#6A0DAD]">{routeData.duration}</div>
              <div className="text-xs text-gray-600">Travel Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#6A0DAD]">{routeData.directions?.length || 0}</div>
              <div className="text-xs text-gray-600">Turn Steps</div>
            </div>
          </div>
        </div>
      )}

      {/* OSRM Features */}
      {showFeatures && (
        <div className="bg-gradient-to-r from-[#F5F3FF] to-[#E6E6FA] p-4 rounded-lg border border-[#CBA0F5]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#6A0DAD]" />
            <span className="font-medium text-[#6A0DAD]">OSRM Enhanced Features</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                <div className="w-8 h-8 bg-[#6A0DAD] rounded-full flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{feature.label}</div>
                  <div className="text-xs text-gray-600">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {coordinates.length >= 2 && (
        <div className="flex gap-2">
          <Button
            onClick={calculateRoute}
            disabled={isLoading}
            className="flex-1 bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Recalculate Route
              </>
            )}
          </Button>
        </div>
      )}

      {/* Status Footer */}
      <div className="bg-[#F5F3FF] p-3 rounded-lg border border-[#E6E6FA]">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-gray-600">
              {isActive ? 'OSRM API Integration Active' : 'OSRM Integration Ready'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>🎯 TSP Solver</span>
            <span>🛣️ Real Roads</span>
            <span>⚡ Live API</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
