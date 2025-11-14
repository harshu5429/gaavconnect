import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Navigation, 
  Download, 
  Share2, 
  Clock, 
  MapPin, 
  ArrowRight,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowUp,
  RotateCcw,
  Copy,
  FileText,
  Map,
  Route
} from 'lucide-react';
import { 
  exportRouteData, 
  getTurnByTurnDirections, 
  getRouteAlternatives,
  type OSRMRoute,
  type OSRMWaypoint 
} from '../utils/osrmApi';
import { toast } from 'sonner';

interface RouteDetailsProps {
  route: OSRMRoute;
  waypoints: OSRMWaypoint[];
  coordinates: Array<{ lat: number; lng: number }>;
  onRouteSelect?: (route: OSRMRoute, waypoints: OSRMWaypoint[]) => void;
}

export function RouteDetails({ route, waypoints, coordinates, onRouteSelect }: RouteDetailsProps) {
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [exportData, setExportData] = useState<any>(null);

  // Get turn-by-turn directions
  const directions = getTurnByTurnDirections(route);

  // Load route alternatives
  const loadAlternatives = async () => {
    setLoadingAlternatives(true);
    try {
      const alts = await getRouteAlternatives(coordinates);
      setAlternatives(alts);
    } catch (error) {
      console.error('Failed to load alternatives:', error);
      toast.error('Failed to load route alternatives');
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Export route data
  const handleExport = () => {
    try {
      const data = exportRouteData(route, waypoints);
      setExportData(data);
      toast.success('Route data prepared for export');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export route data');
    }
  };

  // Download GPX file
  const downloadGPX = () => {
    if (!exportData) return;
    
    const blob = new Blob([exportData.gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaavconnect-route-${new Date().toISOString().split('T')[0]}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('GPX file downloaded');
  };

  // Copy shareable URL
  const copyShareURL = async () => {
    if (!exportData) return;
    
    try {
      await navigator.clipboard.writeText(exportData.url);
      toast.success('Shareable URL copied to clipboard');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  // Get maneuver icon
  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn-right':
      case 'slight-right':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case 'turn-left':
      case 'slight-left':
        return <ArrowUpLeft className="w-4 h-4 text-blue-600" />;
      case 'continue':
      case 'straight':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'uturn':
        return <RotateCcw className="w-4 h-4 text-red-600" />;
      default:
        return <Navigation className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="p-6 border-[#E6E6FA]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#6A0DAD] flex items-center gap-2">
          <Route className="w-5 h-5" />
          Route Details
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="border-[#6A0DAD] text-[#6A0DAD] hover:bg-purple-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="directions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#E6E6FA]">
          <TabsTrigger value="directions" className="data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </TabsTrigger>
          <TabsTrigger value="alternatives" className="data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            <Map className="w-4 h-4 mr-2" />
            Alternatives
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Turn-by-Turn Directions */}
        <TabsContent value="directions" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#F5F3FF] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6A0DAD] rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Total Distance</p>
                  <p className="text-sm text-gray-600">{(route.distance / 1000).toFixed(1)} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#CBA0F5] rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Total Time</p>
                  <p className="text-sm text-gray-600">{Math.round(route.duration / 60)} minutes</p>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {directions.map((direction, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-[#E6E6FA] rounded-lg hover:bg-[#F5F3FF] transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getManeuverIcon(direction.maneuver)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{direction.instruction}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>📍 {(direction.distance / 1000).toFixed(2)} km</span>
                      <span>⏱️ {Math.round(direction.duration / 60)} min</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Step {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Route Alternatives */}
        <TabsContent value="alternatives" className="mt-4">
          <div className="space-y-4">
            {alternatives.length === 0 && (
              <div className="text-center py-8">
                <Button
                  onClick={loadAlternatives}
                  disabled={loadingAlternatives}
                  className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
                >
                  {loadingAlternatives ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Map className="w-4 h-4 mr-2" />
                      Find Alternative Routes
                    </>
                  )}
                </Button>
              </div>
            )}

            {alternatives.map((alt, index) => (
              <Card key={index} className="p-4 border-[#E6E6FA] hover:border-[#6A0DAD] transition-colors cursor-pointer"
                    onClick={() => onRouteSelect?.(alt.trip, alt.waypoints)}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-[#6A0DAD] flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    {alt.name}
                  </h4>
                  <Badge variant={alt.type === 'standard' ? 'default' : 'outline'}>
                    {alt.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{alt.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {(alt.trip.distance / 1000).toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(alt.trip.duration / 60)} min
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#6A0DAD] ml-auto" />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Export Options */}
        <TabsContent value="export" className="mt-4">
          <div className="space-y-4">
            {!exportData && (
              <div className="text-center py-8">
                <Button
                  onClick={handleExport}
                  className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Prepare Export Data
                </Button>
              </div>
            )}

            {exportData && (
              <div className="space-y-3">
                <Card className="p-4 border-[#E6E6FA]">
                  <h4 className="font-semibold text-[#6A0DAD] mb-3">Export Options</h4>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={downloadGPX}
                      variant="outline"
                      className="w-full justify-start border-[#6A0DAD] text-[#6A0DAD] hover:bg-purple-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download GPX File
                      <span className="ml-auto text-xs text-gray-500">For GPS devices</span>
                    </Button>

                    <Button
                      onClick={copyShareURL}
                      variant="outline"
                      className="w-full justify-start border-[#6A0DAD] text-[#6A0DAD] hover:bg-purple-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Shareable URL
                      <span className="ml-auto text-xs text-gray-500">Share with others</span>
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 border-[#E6E6FA]">
                  <h4 className="font-semibold text-[#6A0DAD] mb-3">Route Summary</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Distance:</strong> {(route.distance / 1000).toFixed(1)} km</p>
                    <p><strong>Duration:</strong> {Math.round(route.duration / 60)} minutes</p>
                    <p><strong>Waypoints:</strong> {waypoints.length}</p>
                    <p><strong>Directions:</strong> {directions.length} steps</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
