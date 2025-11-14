import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Target,
  Navigation
} from 'lucide-react';
import { LocationInput } from './LocationInput';
import type { Coordinate, Stop } from '../App';
import type { PlaceDetails } from '../utils/placesAutocomplete';

interface MultiCoordinateSelectorProps {
  stop: Stop;
  onStopUpdate: (updatedStop: Stop) => void;
  onRemoveStop: () => void;
}

export function MultiCoordinateSelector({ 
  stop, 
  onStopUpdate, 
  onRemoveStop 
}: MultiCoordinateSelectorProps) {
  const [isAddingCoordinate, setIsAddingCoordinate] = useState(false);
  const [newCoordinateInput, setNewCoordinateInput] = useState('');
  const [newCoordinateDetails, setNewCoordinateDetails] = useState<PlaceDetails | null>(null);
  const [editingCoordinateIndex, setEditingCoordinateIndex] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Get the currently selected coordinate or fallback to main coordinates
  const getSelectedCoordinate = (): Coordinate => {
    if (stop.coordinates && stop.coordinates.length > 0 && stop.selectedCoordinateIndex !== undefined) {
      return stop.coordinates[stop.selectedCoordinateIndex];
    }
    return { lat: stop.lat, lng: stop.lng, label: 'Main Location' };
  };

  const addNewCoordinate = () => {
    if (!newCoordinateDetails) return;

    const newCoordinate: Coordinate = {
      lat: newCoordinateDetails.geometry.location.lat,
      lng: newCoordinateDetails.geometry.location.lng,
      label: newCoordinateInput || 'Additional Location'
    };

    const updatedCoordinates = [...(stop.coordinates || []), newCoordinate];
    
    const updatedStop: Stop = {
      ...stop,
      coordinates: updatedCoordinates
    };

    onStopUpdate(updatedStop);
    setIsAddingCoordinate(false);
    setNewCoordinateInput('');
    setNewCoordinateDetails(null);
  };

  const removeCoordinate = (index: number) => {
    if (!stop.coordinates) return;

    const updatedCoordinates = stop.coordinates.filter((_, i) => i !== index);
    let newSelectedIndex = stop.selectedCoordinateIndex;

    // Adjust selected index if necessary
    if (newSelectedIndex !== undefined) {
      if (newSelectedIndex === index) {
        newSelectedIndex = 0; // Select first coordinate if current was removed
      } else if (newSelectedIndex > index) {
        newSelectedIndex -= 1; // Adjust index if a coordinate before the selected one was removed
      }
    }

    const updatedStop: Stop = {
      ...stop,
      coordinates: updatedCoordinates.length > 0 ? updatedCoordinates : undefined,
      selectedCoordinateIndex: updatedCoordinates.length > 0 ? newSelectedIndex : undefined
    };

    onStopUpdate(updatedStop);
  };

  const selectCoordinate = (index: number) => {
    const updatedStop: Stop = {
      ...stop,
      selectedCoordinateIndex: index,
      // Update main lat/lng to selected coordinate
      lat: stop.coordinates![index].lat,
      lng: stop.coordinates![index].lng
    };

    onStopUpdate(updatedStop);
  };

  const updateCoordinateLabel = (index: number, newLabel: string) => {
    if (!stop.coordinates) return;

    const updatedCoordinates = [...stop.coordinates];
    updatedCoordinates[index] = { ...updatedCoordinates[index], label: newLabel };

    const updatedStop: Stop = {
      ...stop,
      coordinates: updatedCoordinates
    };

    onStopUpdate(updatedStop);
    setEditingCoordinateIndex(null);
    setEditingLabel('');
  };

  const selectedCoordinate = getSelectedCoordinate();

  return (
    <Card className="p-4 border-[#E6E6FA] bg-gradient-to-r from-[#F5F3FF] to-white">
      {/* Main Stop Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6A0DAD] text-white rounded-full flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{stop.name}</h3>
            <p className="text-sm text-gray-600">
              📍 {selectedCoordinate.lat.toFixed(6)}, {selectedCoordinate.lng.toFixed(6)}
            </p>
            {selectedCoordinate.label && (
              <Badge className="bg-green-100 text-green-700 text-xs mt-1">
                {selectedCoordinate.label}
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={onRemoveStop}
          variant="outline"
          size="sm"
          className="text-red-500 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Multiple Coordinates Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Multiple Locations ({(stop.coordinates?.length || 0) + 1})
          </h4>
          <Button
            onClick={() => setIsAddingCoordinate(true)}
            variant="outline"
            size="sm"
            className="border-[#CBA0F5] text-[#6A0DAD] hover:bg-[#F5F3FF]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Location
          </Button>
        </div>

        {/* Main Coordinate */}
        <div className={`p-3 bg-white rounded-lg border-2 ${
          stop.selectedCoordinateIndex === undefined ? 'border-[#6A0DAD]' : 'border-gray-200'
        } hover:border-[#CBA0F5] transition-colors cursor-pointer`}
        onClick={() => {
          if (stop.coordinates && stop.coordinates.length > 0) {
            // Reset to main coordinate
            const updatedStop: Stop = {
              ...stop,
              selectedCoordinateIndex: undefined,
              lat: stop.lat,
              lng: stop.lng
            };
            onStopUpdate(updatedStop);
          }
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#6A0DAD]" />
              <div>
                <p className="font-medium text-gray-800">Main Location</p>
                <p className="text-xs text-gray-500">
                  {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
                </p>
              </div>
            </div>
            {stop.selectedCoordinateIndex === undefined && (
              <Badge className="bg-[#6A0DAD] text-white">Selected</Badge>
            )}
          </div>
        </div>

        {/* Additional Coordinates */}
        {stop.coordinates?.map((coordinate, index) => (
          <div key={index} className={`p-3 bg-white rounded-lg border-2 ${
            stop.selectedCoordinateIndex === index ? 'border-[#6A0DAD]' : 'border-gray-200'
          } hover:border-[#CBA0F5] transition-colors cursor-pointer`}
          onClick={() => selectCoordinate(index)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8B2DC2]" />
                <div>
                  {editingCoordinateIndex === index ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        placeholder="Enter label..."
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                      <Button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          updateCoordinateLabel(index, editingLabel);
                        }}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white p-1"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setEditingCoordinateIndex(null);
                          setEditingLabel('');
                        }}
                        size="sm"
                        variant="outline"
                        className="p-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800">
                        {coordinate.label || `Location ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {coordinate.lat.toFixed(6)}, {coordinate.lng.toFixed(6)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stop.selectedCoordinateIndex === index && (
                  <Badge className="bg-[#6A0DAD] text-white">Selected</Badge>
                )}
                <Button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setEditingCoordinateIndex(index);
                    setEditingLabel(coordinate.label || '');
                  }}
                  size="sm"
                  variant="outline"
                  className="p-1"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeCoordinate(index);
                  }}
                  size="sm"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Coordinate Form */}
        {isAddingCoordinate && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-3">
              <LocationInput
                value={newCoordinateInput}
                onChange={(value, placeDetails) => {
                  setNewCoordinateInput(value);
                  setNewCoordinateDetails(placeDetails || null);
                }}
                placeholder="Search for additional location..."
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  onClick={addNewCoordinate}
                  disabled={!newCoordinateDetails}
                  className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Add
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingCoordinate(false);
                    setNewCoordinateInput('');
                    setNewCoordinateDetails(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Hint */}
      <div className="mt-4 p-2 bg-purple-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Add multiple coordinates for destinations with multiple entrances, 
          parking areas, or specific locations within a complex. Click on any coordinate to select it for routing.
        </p>
      </div>
    </Card>
  );
}
