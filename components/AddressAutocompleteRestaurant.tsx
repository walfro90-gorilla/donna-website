'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleMapsProxy } from '@/lib/utils/googleMapsProxy';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, placeData?: any) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocompleteRestaurant({
  value,
  onChange,
  placeholder = "Dirección del restaurante",
  className = ""
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places service
  const [placesService, setPlacesService] = useState<any>(null);

  useEffect(() => {
    // Check if script is already present in DOM to avoid duplicate tags
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');

    if (typeof window !== 'undefined' && !window.google && !existingScript) {
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (googleMapsApiKey && !googleMapsApiKey.includes('supabase.co')) {
        const script = document.createElement('script');
        // Add callback to ensure we know when it's loaded
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async&callback=initMap`;
        script.async = true;
        script.defer = true;

        // Define global callback
        window.initMap = () => {
          initializePlaces();
        };

        document.head.appendChild(script);
      } else {
        console.log('⚠️ Google Maps API key not configured, using edge function only');
      }
    } else {
      // If google is already available or script exists, wait for it
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkGoogle);
          initializePlaces();
        }
      }, 100);

      // Cleanup interval
      return () => clearInterval(checkGoogle);
    }
  }, []);

  const initializePlaces = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      // Use the newer AutocompleteSuggestion if available, fallback to AutocompleteService
      if (window.google.maps.places.AutocompleteSuggestion) {
        console.log('✅ Using new AutocompleteSuggestion API');
        setPlacesService('new-api');
      } else if (window.google.maps.places.AutocompleteService) {
        console.log('⚠️ Using legacy AutocompleteService API');
        const service = new window.google.maps.places.AutocompleteService();
        setPlacesService(service);
      }
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    // Try Google Maps API first if available
    if (placesService && window.google) {
      try {
        if (placesService === 'new-api' && window.google.maps.places.AutocompleteSuggestion) {
          // Use new API (when available)
          console.log('🔍 Using new AutocompleteSuggestion API');
          // For now, fallback to edge function as the new API might not be fully available yet
          await searchWithEdgeFunction(query);
          return;
        } else if (placesService.getPlacePredictions) {
          // Use legacy API
          placesService.getPlacePredictions(
            {
              input: query,
              componentRestrictions: { country: 'mx' },
              types: ['establishment', 'geocode'],
            },
            (predictions: any[], status: any) => {
              setIsLoading(false);

              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                console.log('✅ Got predictions from Google Maps API:', predictions.length);
                setSuggestions(predictions.slice(0, 5));
                setShowSuggestions(true);
              } else {
                console.log('❌ Google Maps API failed with status:', status);
                // Fallback to edge function
                searchWithEdgeFunction(query);
              }
            }
          );
          return;
        }
      } catch (error) {
        console.error('❌ Error with Google Maps API:', error);
        setIsLoading(false);
      }
    }

    // Fallback to edge function
    await searchWithEdgeFunction(query);
  };

  const searchWithEdgeFunction = async (query: string) => {
    try {
      console.log('🔍 Searching places with edge function:', query);

      const result = await GoogleMapsProxy.getPlaceAutocomplete({
        input: query,
        components: 'country:mx',
        types: 'establishment|geocode',
        language: 'es'
      });

      setIsLoading(false);

      // Check different possible response formats
      let predictions = null;

      if (result.predictions && Array.isArray(result.predictions)) {
        predictions = result.predictions;
      } else if (result.data && result.data.predictions && Array.isArray(result.data.predictions)) {
        predictions = result.data.predictions;
      } else if (result.results && Array.isArray(result.results)) {
        predictions = result.results;
      }

      if (predictions && predictions.length > 0) {
        console.log('✅ Got predictions from edge function:', predictions.length);
        setSuggestions(predictions.slice(0, 5));
        setShowSuggestions(true);
      } else {
        console.log('❌ No predictions found');
        setSuggestions([]);
        setShowSuggestions(false);
      }

    } catch (error) {
      console.error('❌ Error with edge function:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: any) => {
    console.log('📍 Selected suggestion:', suggestion);

    // Try Google Maps API first if available
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));

        service.getDetails(
          {
            placeId: suggestion.place_id,
            fields: ['geometry', 'formatted_address', 'name', 'types', 'address_components']
          },
          (place: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const lat = place.geometry?.location?.lat();
              const lng = place.geometry?.location?.lng();

              onChange(place.formatted_address || suggestion.description, {
                placeId: suggestion.place_id,
                description: place.formatted_address || suggestion.description,
                types: place.types,
                coordinates: lat && lng ? { lat, lng } : null,
                place: place
              });
            } else {
              // Fallback to edge function
              getPlaceDetailsWithEdgeFunction(suggestion);
            }
          }
        );

        setSuggestions([]);
        setShowSuggestions(false);
        return;
      } catch (error) {
        console.error('❌ Error with Google Maps API place details:', error);
      }
    }

    // Fallback to edge function
    await getPlaceDetailsWithEdgeFunction(suggestion);
  };

  const getPlaceDetailsWithEdgeFunction = async (suggestion: any) => {
    try {
      const placeDetails = await GoogleMapsProxy.getPlaceDetails({
        placeId: suggestion.place_id,
        fields: ['geometry', 'formatted_address', 'name', 'types', 'address_components']
      });

      const coordinates = GoogleMapsProxy.extractCoordinates(placeDetails);
      const formattedAddress = GoogleMapsProxy.extractAddress(placeDetails);
      const structuredAddress = GoogleMapsProxy.createStructuredAddress(placeDetails);

      onChange(formattedAddress || suggestion.description, {
        placeId: suggestion.place_id,
        description: formattedAddress || suggestion.description,
        types: suggestion.types,
        coordinates,
        structuredAddress
      });

    } catch (error) {
      console.error('❌ Error getting place details with edge function:', error);

      // Final fallback to basic suggestion data
      onChange(suggestion.description, {
        placeId: suggestion.place_id,
        description: suggestion.description,
        types: suggestion.types
      });
    }

    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        className={`flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500 ${className}`}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#e4007c] rounded-full animate-spin"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </p>
                  {suggestion.structured_formatting?.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}