import { Card } from './ui/card';
import { MapPin, Route, Clock, DollarSign, Zap } from 'lucide-react';
import { calculateDistance, estimateTravelTime, calculateFare } from '../utils/distance';
import type { Stop } from '../App';
import type { PlaceDetails } from '../utils/placesAutocomplete';

interface SegmentDetailsProps {
  origin?: string;
  originDetails?: PlaceDetails | null;
  stops: Stop[];
}

export function SegmentDetails({ origin, originDetails, stops }: SegmentDetailsProps) {
  console.log('SegmentDetails rendered with:', { origin, stops: stops.length, originDetails });
  
  if (!origin || stops.length === 0) {
    console.log('SegmentDetails: Returning null - origin:', origin, 'stops.length:', stops.length);
    return null;
  }

  // Build full journey array: origin -> all stops
  const journeyPoints = [
    {
      name: origin,
      lat: originDetails?.geometry.location.lat || 17.3850,
      lng: originDetails?.geometry.location.lng || 78.4867,
    },
    ...stops,
  ];

  // Calculate segments
  const segments = [];
  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;

  for (let i = 0; i < journeyPoints.length - 1; i++) {
    const from = journeyPoints[i];
    const to = journeyPoints[i + 1];

    const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const time = estimateTravelTime(distance, 'auto'); // Using auto as default
    const cost = calculateFare(distance, 'auto');

    totalDistance += distance;
    totalTime += time;
    totalCost += cost;

    segments.push({
      from: from.name,
      to: to.name,
      distance,
      time,
      cost,
      index: i,
    });
  }

  console.log('📊 Segments calculated:', { 
    totalSegments: segments.length, 
    totalDistance, 
    totalTime, 
    totalCost,
    segments 
  });

  const formatTime = (minutes: number) => {
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

  return (
    <div className="mt-6 space-y-4">
      {/* Summary Card */}
      <Card className="p-4 bg-gradient-to-r from-[#E6E6FA] to-[#F5F3FF] border-[#CBA0F5]">
        <div className="flex items-center gap-2 mb-3">
          <Route className="w-5 h-5 text-[#6A0DAD]" />
          <h3 className="text-lg font-semibold text-[#6A0DAD]">Journey Summary</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#8B2DC2]" />
            <div>
              <p className="text-xs text-gray-600">Total Distance</p>
              <p className="font-bold text-[#6A0DAD]">{totalDistance.toFixed(1)} km</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8B2DC2]" />
            <div>
              <p className="text-xs text-gray-600">Total Time</p>
              <p className="font-bold text-[#6A0DAD]">{formatTime(totalTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#8B2DC2]" />
            <div>
              <p className="text-xs text-gray-600">Estimated Cost</p>
              <p className="font-bold text-[#6A0DAD]">₹{totalCost}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Segment Details */}
      <Card className="p-4 border-[#E6E6FA]">
        <h3 className="font-semibold text-[#6A0DAD] mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Segment Breakdown ({segments.length} segments)
        </h3>
        <div className="space-y-3">
          {segments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No segments to display</p>
          ) : (
            segments.map((segment, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#F5F3FF] rounded-lg border-l-4 border-[#CBA0F5] hover:bg-[#E6E6FA] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#6A0DAD] text-white text-xs font-bold rounded-full">
                        {idx + 1}
                      </span>
                      <p className="font-medium text-[#6A0DAD]">{segment.from}</p>
                      <span className="text-[#CBA0F5]">→</span>
                      <p className="font-medium text-[#6A0DAD]">{segment.to}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs ml-8">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8B2DC2]" />
                        <span className="text-gray-600">{segment.distance.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8B2DC2]" />
                        <span className="text-gray-600">{formatTime(segment.time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-[#8B2DC2]" />
                        <span className="text-gray-600">₹{segment.cost}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
