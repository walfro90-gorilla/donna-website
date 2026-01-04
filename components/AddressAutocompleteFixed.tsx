// components/AddressAutocompleteFixed.tsx
// Componente de autocompletado de direcciones completamente funcional

'use client';

import { useState, useRef } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, placeData?: any) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocompleteFixed({
  value,
  onChange,
  placeholder = "Dirección del restaurante",
  className = ""
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 Searching places:', query);

      const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'autocomplete',
          input: query,
          components: 'country:mx',
          types: 'establishment|geocode',
          language: 'es'
        })
      });

      const result = await response.json();
      setIsLoading(false);

      console.log('📦 Autocomplete response:', result);

      // Extract predictions from response
      const predictions = result.predictions || result.results || [];

      if (predictions.length > 0) {
        console.log('✅ Got predictions:', predictions.length);
        setSuggestions(predictions.slice(0, 5));
        setShowSuggestions(true);
      } else {
        console.log('❌ No predictions found');
        setSuggestions([]);
        setShowSuggestions(false);
      }

    } catch (error) {
      console.error('❌ Error searching places:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: any) => {
    console.log('📍 Selected suggestion:', suggestion);

    try {
      // Get place details with coordinates
      console.log('🔍 Getting place details for:', suggestion.place_id);

      const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'place_details',
          place_id: suggestion.place_id,
          fields: 'geometry,formatted_address,name,types,address_components',
          language: 'es'
        })
      });

      const result = await response.json();
      console.log('📦 Place details response:', result);

      // Extract coordinates from the response
      let coordinates = null;
      let formattedAddress = suggestion.description;

      // The edge function returns coordinates directly in the response
      if (result.lat && result.lon) {
        coordinates = {
          lat: result.lat,
          lng: result.lon  // Convert 'lon' to 'lng'
        };
        formattedAddress = result.formatted_address || formattedAddress;
        console.log('✅ Extracted coordinates from response:', coordinates);
      }
      // Fallback: Try standard Google Maps structure
      else if (result.result?.geometry?.location) {
        coordinates = {
          lat: result.result.geometry.location.lat,
          lng: result.result.geometry.location.lng
        };
        formattedAddress = result.result.formatted_address || formattedAddress;
        console.log('✅ Extracted coordinates from result.result:', coordinates);
      } else if (result.geometry?.location) {
        coordinates = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        };
        formattedAddress = result.formatted_address || formattedAddress;
        console.log('✅ Extracted coordinates from result:', coordinates);
      }

      if (coordinates) {
        console.log('✅ Final coordinates:', coordinates);
        console.log('✅ Final address:', formattedAddress);

        onChange(formattedAddress, {
          placeId: suggestion.place_id,
          description: formattedAddress,
          types: suggestion.types,
          coordinates: coordinates
        });
      } else {
        console.warn('⚠️ No coordinates found in response');
        console.warn('Response structure:', result);
        onChange(formattedAddress, {
          placeId: suggestion.place_id,
          description: formattedAddress,
          types: suggestion.types,
          coordinates: null
        });
      }

    } catch (error) {
      console.error('❌ Error getting place details:', error);

      // Fallback
      onChange(suggestion.description, {
        placeId: suggestion.place_id,
        description: suggestion.description,
        types: suggestion.types,
        coordinates: null
      });
    }

    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        className={`flex-1 outline-none bg-transparent dark:text-gray-100 text-gray-900 placeholder-gray-500 ${className}`}
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#e4007c] rounded-full animate-spin"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[9999] left-0 w-full mt-2 bg-white dark:bg-[#1f2937] border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5 focus:outline-none">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              onMouseDown={(e) => {
                // Prevent input blur before click is registered
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150 ease-in-out"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </p>
                  {suggestion.structured_formatting?.secondary_text && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">
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