import { MapPin, Route, Clock, DollarSign } from 'lucide-react';
import type { Stop } from '../App';

interface FallbackMapProps {
  origin?: string;
  stops: Stop[];
  totalDistance?: string;
  totalDuration?: string;
  totalCost?: number;
}

export function FallbackMap({ 
  origin, 
  stops, 
  totalDistance = 'N/A',
  totalDuration = 'N/A',
  totalCost = 0 
}: FallbackMapProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Route className="w-5 h-5 text-blue-600" />
          Route Summary
        </h3>
        <div className="text-sm text-gray-600">
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
        </div>
      </div>

      {/* Route Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 text-center">
          <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-sm font-medium text-gray-800">{totalDistance}</div>
          <div className="text-xs text-gray-500">Distance</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-sm font-medium text-gray-800">{totalDuration}</div>
          <div className="text-xs text-gray-500">Duration</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <DollarSign className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <div className="text-sm font-medium text-gray-800">₹{totalCost}</div>
          <div className="text-xs text-gray-500">Cost</div>
        </div>
      </div>

      {/* Route Points */}
      <div className="flex-1 bg-white rounded-lg p-4 overflow-auto">
        <div className="space-y-3">
          {/* Origin */}
          {origin && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                S
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">Start Point</div>
                <div className="text-sm text-gray-600">{origin}</div>
              </div>
            </div>
          )}

          {/* Waypoints */}
          {stops.map((stop, index) => (
            <div key={stop.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">Destination {index + 1}</div>
                <div className="text-sm text-gray-600">{stop.name}</div>
                {stop.lat && stop.lng && (
                  <div className="text-xs text-gray-500">
                    {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note about Google Maps */}
      <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-yellow-800 text-sm font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Interactive Map Not Available
            </p>
            <p className="text-xs text-yellow-700 mb-3">
              To enable the interactive Google Maps view, you need to configure a Google Maps API key.
            </p>
            <div className="bg-yellow-100 rounded p-2 text-xs text-yellow-800">
              <strong>Quick Setup:</strong><br/>
              1. Get API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" className="underline">Google Cloud Console</a><br/>
              2. Enable "Maps JavaScript API" and "Places API"<br/>
              3. Add to .env file: <code className="bg-yellow-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY=your_key_here</code><br/>
              4. Restart the development server
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
