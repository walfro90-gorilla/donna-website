"use client";
import React, { useRef, useEffect } from 'react';
import useGoogleMaps from '@/lib/hooks/useGoogleMaps';
import type { Address } from '@/types/address';

interface Props {
  onAddressSelect: (address: Address) => void;
  apiKey: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  error?: string;
}

const AddressAutocomplete: React.FC<Props> = ({
  onAddressSelect,
  apiKey,
  required = false,
  label,
  placeholder,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, error: mapsError } = useGoogleMaps(apiKey);

  useEffect(() => {
    if (isLoaded && inputRef.current && !mapsError) {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'mx' }, // Restringir a México
          fields: ['address_components', 'geometry', 'place_id', 'formatted_address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.address_components) {
            const structured_address: { [key: string]: string } = {};
            place.address_components.forEach(component => {
              structured_address[component.types[0]] = component.long_name;
            });
            
            onAddressSelect({
              address: place.formatted_address || '',
              address_structured: structured_address,
              location_lat: place.geometry.location?.lat() || null,
              location_lon: place.geometry.location?.lng() || null,
              location_place_id: place.place_id || null,
            });
          }
        });
      } catch (err) {
        console.error('Error initializing Google Maps Autocomplete:', err);
      }
    }
  }, [isLoaded, mapsError, onAddressSelect]);

  return (
    <div>
      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
        {label || 'Dirección'}
        {required && <span className="text-red-500 ml-1" aria-label="requerido">*</span>}
      </label>
      <input
        ref={inputRef}
        type="text"
        id="address"
        required={required}
        className={`mt-1 block w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] bg-white text-gray-900 placeholder-gray-400`}
        placeholder={placeholder || "Empieza a escribir la dirección..."}
        aria-describedby={error ? 'address-error' : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <p id="address-error" className="text-red-500 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
      {mapsError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-red-700 text-sm font-medium mb-1">
            Error de Google Maps API
          </p>
          <p className="text-red-600 text-xs">
            {mapsError.message}
          </p>
          {mapsError.code === 'INVALID_API_KEY' && (
            <div className="mt-2 text-xs text-red-600">
              <p className="font-medium mb-1">Pasos para solucionarlo:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-2">
                <li>Verifica que tu clave de API sea correcta</li>
                <li>Asegúrate de que la API "Maps JavaScript API" esté habilitada en Google Cloud Console</li>
                <li>Verifica que tu proyecto tenga facturación habilitada</li>
                <li>Revisa las restricciones de API key (dominio, referrer)</li>
              </ol>
            </div>
          )}
          {mapsError.code === 'MISSING_API_KEY' && (
            <div className="mt-2 text-xs text-red-600">
              <p className="font-medium mb-1">Configuración requerida:</p>
              <p className="ml-2">Crea un archivo <code className="bg-red-100 px-1 rounded">.env.local</code> en la raíz del proyecto con:</p>
              <pre className="mt-1 ml-2 bg-red-100 p-2 rounded text-xs overflow-x-auto">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_aqui
              </pre>
            </div>
          )}
        </div>
      )}
      {!apiKey && !mapsError && (
        <p className="text-red-500 text-xs mt-1" role="alert">
          Falta la clave de API de Google Maps para la dirección.
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
