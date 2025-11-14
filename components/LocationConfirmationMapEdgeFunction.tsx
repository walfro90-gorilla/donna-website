// components/LocationConfirmationMapEdgeFunction.tsx
// Mapa de confirmación que usa solo la edge function (sin Google Maps API key)

'use client';

import { useState, useEffect } from 'react';
import { GoogleMapsProxy } from '@/lib/utils/googleMapsProxy';

interface LocationConfirmationMapProps {
  address: string;
  initialLat?: number;
  initialLng?: number;
  onLocationConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function LocationConfirmationMapEdgeFunction({
  address,
  initialLat,
  initialLng,
  onLocationConfirm,
  onCancel,
  isOpen
}: LocationConfirmationMapProps) {
  const [currentLat, setCurrentLat] = useState(initialLat || 19.4326);
  const [currentLng, setCurrentLng] = useState(initialLng || -99.1332);
  const [confirmedAddress, setConfirmedAddress] = useState(address);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force map refresh
  const [showStaticMap, setShowStaticMap] = useState(true);
  
  const apiKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : '';
  
  useEffect(() => {
    console.log('🔑 API Key available:', !!apiKey);
    if (apiKey) {
      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${currentLat},${currentLng}&zoom=16&size=800x400&scale=2&markers=color:red%7Clabel:R%7C${currentLat},${currentLng}&key=${apiKey}`;
      console.log('🗺️ Full Map URL:', mapUrl);
      console.log('💡 If map fails to load, you may need to enable "Maps Static API" in Google Cloud Console');
    }
  }, [apiKey, currentLat, currentLng]);

  // Get coordinates from address using edge function
  useEffect(() => {
    if (!isOpen) return;

    const getCoordinatesFromAddress = async () => {
      // If we have initial coordinates, use them
      if (initialLat && initialLng) {
        console.log('✅ Using provided coordinates:', { lat: initialLat, lng: initialLng, address });
        setCurrentLat(initialLat);
        setCurrentLng(initialLng);
        setConfirmedAddress(address);
        setMapKey(prev => prev + 1); // Force map refresh
        return;
      } else {
        console.log('⚠️ No initial coordinates provided, will geocode address');
      }

      // Otherwise, geocode the address
      if (!address) return;

      try {
        console.log('🔍 Getting coordinates for address:', address);
        
        const result = await GoogleMapsProxy.geocode({ address });
        
        if (result.results && result.results.length > 0) {
          const location = result.results[0].geometry?.location;
          if (location) {
            console.log('✅ Got coordinates from edge function:', location);
            setCurrentLat(location.lat);
            setCurrentLng(location.lng);
            setConfirmedAddress(result.results[0].formatted_address || address);
            setMapKey(prev => prev + 1); // Force map refresh
          }
        }
      } catch (error) {
        console.error('❌ Error getting coordinates:', error);
        // Keep the initial coordinates if geocoding fails
      }
    };

    getCoordinatesFromAddress();
  }, [isOpen, address, initialLat, initialLng]);

  const handleCoordinateChange = async (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newLat = field === 'lat' ? numValue : currentLat;
    const newLng = field === 'lng' ? numValue : currentLng;

    if (field === 'lat') {
      setCurrentLat(numValue);
    } else {
      setCurrentLng(numValue);
    }

    // Force map refresh
    setMapKey(prev => prev + 1);

    // Update address based on new coordinates
    setIsLoadingAddress(true);
    try {
      const result = await GoogleMapsProxy.reverseGeocode(newLat, newLng);
      
      if (result.results && result.results.length > 0) {
        setConfirmedAddress(result.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Error updating address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleConfirm = () => {
    onLocationConfirm(currentLat, currentLng, confirmedAddress);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Confirma tu ubicación</h3>
              <p className="text-sm text-gray-600 mt-1">
                Ajusta las coordenadas para obtener la ubicación exacta
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Map Alternative - Coordinate Input */}
        <div className="p-6 space-y-6">
          {/* Static Map Visualization */}
          <div className="bg-gray-100 rounded-xl overflow-hidden">
            <div className="relative h-80 bg-gradient-to-br from-blue-50 to-indigo-100">
              {showStaticMap && apiKey ? (
                <img
                  key={mapKey}
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${currentLat},${currentLng}&zoom=16&size=800x400&scale=2&markers=color:red%7Clabel:R%7C${currentLat},${currentLng}&key=${apiKey}`}
                  alt="Mapa de ubicación"
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('✅ Static map loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('❌ Failed to load static map');
                    console.error('Map URL:', e.currentTarget.src);
                    setShowStaticMap(false);
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                  <div className="text-center relative">
                    {/* Decorative circles */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 w-32 h-32 bg-[#e4007c] opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12 w-40 h-40 bg-pink-500 opacity-10 rounded-full blur-2xl"></div>
                    
                    {/* Main icon */}
                    <div className="relative w-24 h-24 bg-gradient-to-r from-[#e4007c] to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    
                    {/* Text content */}
                    <h4 className="text-2xl font-bold text-gray-800 mb-3">Ubicación del Restaurante</h4>
                    <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                      Las coordenadas se han calculado automáticamente desde la dirección proporcionada.
                    </p>
                    
                    {/* Coordinates display */}
                    <div className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-lg mb-4">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="text-left">
                        <p className="text-xs text-gray-500 font-medium">Coordenadas GPS</p>
                        <p className="text-sm font-bold text-gray-800">{currentLat.toFixed(6)}, {currentLng.toFixed(6)}</p>
                      </div>
                    </div>
                    
                    {/* Info message */}
                    <div className="mt-4 max-w-sm mx-auto">
                      <p className="text-xs text-gray-500 mb-2">
                        Puedes ajustar las coordenadas manualmente si necesitas mayor precisión
                      </p>
                      {!apiKey && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800">
                            💡 Para ver el mapa visual, habilita "Maps Static API" en Google Cloud Console
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coordinate inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Latitud</label>
              <input
                type="number"
                step="0.000001"
                value={currentLat}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] outline-none transition-all"
                placeholder="19.432608"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Longitud</label>
              <input
                type="number"
                step="0.000001"
                value={currentLng}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] outline-none transition-all"
                placeholder="-99.133209"
              />
            </div>
          </div>

          {/* Address display */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-[#e4007c] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Dirección confirmada:</p>
                {isLoadingAddress ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-4 h-4 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">Actualizando dirección...</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">{confirmedAddress}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  📍 Coordenadas: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Help text */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">💡 Cómo ajustar la ubicación</p>
                <p className="text-xs text-blue-600 mt-1">
                  • Las coordenadas se calcularon automáticamente desde la dirección<br/>
                  • Ajusta los valores de latitud y longitud para mayor precisión<br/>
                  • El mapa se actualizará automáticamente con los nuevos valores
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#e4007c] to-pink-500 text-white rounded-xl font-medium hover:from-[#c6006b] hover:to-pink-600 transition-all shadow-lg"
          >
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  );
}