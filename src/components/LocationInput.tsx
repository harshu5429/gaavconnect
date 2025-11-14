import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { getPlacePredictions, getPlaceDetails, type PlacePrediction, type PlaceDetails } from '../utils/placesAutocomplete';

interface LocationInputProps {
  value: string;
  onChange: (value: string, placeDetails?: PlaceDetails | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationInput({ 
  value, 
  onChange, 
  placeholder = "Enter location...", 
  className = ""
}: LocationInputProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (input: string) => {
    onChange(input, undefined);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!input.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true);

    // Debounce API calls - reduced to instant for better UX
    debounceRef.current = setTimeout(async () => {
      try {
        console.log('🔍 LocationInput: Fetching predictions for:', input);
        const results = await getPlacePredictions(input);
        console.log('✅ LocationInput: Predictions received:', results);
        setPredictions(results);
        if (results.length > 0) {
          console.log('📍 Showing', results.length, 'suggestions');
          setShowSuggestions(true);
        } else {
          console.log('⚠️ No predictions found for:', input);
          setShowSuggestions(true); // Still show "no results" message
        }
      } catch (error) {
        console.error('❌ LocationInput: Error getting predictions:', error);
        setPredictions([]);
        setShowSuggestions(true);
      } finally {
        setIsLoading(false);
      }
    }, 50) as NodeJS.Timeout;
  };

  const handlePredictionClick = async (prediction: PlacePrediction) => {
    console.log('Prediction clicked:', prediction);
    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      const placeDetails = await getPlaceDetails(prediction.place_id);
      console.log('Place details received:', placeDetails);
      if (placeDetails) {
        console.log('Calling onChange with:', prediction.description, placeDetails);
        onChange(prediction.description, placeDetails);
      } else {
        console.log('No place details found, calling onChange with description only');
        onChange(prediction.description);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      onChange(prediction.description);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CBA0F5] w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (value && predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={false} // Never disable the input
          className="w-full pl-10 pr-10 py-3 border-2 border-[#CBA0F5] rounded-lg focus:outline-none focus:border-[#6A0DAD] transition-colors bg-white disabled:bg-gray-100"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CBA0F5] w-4 h-4 animate-spin" />
        )}
        {!isLoading && value && (
          <button
            onClick={() => {
              onChange('', undefined);
              setPredictions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-[#CBA0F5] rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={`${prediction.place_id}-${index}`}
              onClick={() => handlePredictionClick(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-[#F5F3FF] transition-colors border-b border-[#E6E6FA] last:border-b-0 flex items-start gap-3"
            >
              <MapPin className="text-[#CBA0F5] w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#6A0DAD] truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && predictions.length === 0 && value.trim() && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-[#CBA0F5] rounded-lg shadow-xl px-4 py-3 text-gray-500 text-center">
          No locations found. Try a different search term.
        </div>
      )}
    </div>
  );
}
