// components/LocationConfirmationMap.tsx
// Componente de mapa para confirmar ubicación (como en la app móvil)

'use client';

import { useState, useEffect, useRef } from 'react';

interface LocationConfirmationMapProps {
  address: string;
  initialLat?: number;
  initialLng?: number;
  onLocationConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function LocationConfirmationMap({
  address,
  initialLat,
  initialLng,
  onLocationConfirm,
  onCancel,
  isOpen
}: LocationConfirmationMapProps) {
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [currentLat, setCurrentLat] = useState(initialLat || 19.4326);
  const [currentLng, setCurrentLng] = useState(initialLng || -99.1332);
  const [confirmedAddress, setConfirmedAddress] = useState(address);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Initialize Google Maps
    const initMap = () => {
      if (!window.google) return;

      const mapInstance = new window.google.maps.Map(mapRef.current!, {
        center: { lat: currentLat, lng: currentLng },
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      const markerInstance = new window.google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: mapInstance,
        draggable: true,
        title: 'Arrastra para ajustar la ubicación'
      });

      // Handle marker drag
      markerInstance.addListener('dragend', async (event: any) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        setCurrentLat(newLat);
        setCurrentLng(newLng);

        // Reverse geocoding to get address using edge function
        try {
          const { GoogleMapsProxy } = await import('@/lib/utils/googleMapsProxy');
          const result = await GoogleMapsProxy.reverseGeocode(newLat, newLng);
          
          if (result.results && result.results[0]) {
            setConfirmedAddress(result.results[0].formatted_address);
          }
        } catch (error) {
          console.error('Error with edge function reverse geocoding:', error);
          
          // Fallback to direct Google Maps API
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: newLat, lng: newLng } },
            (results: any[], status: any) => {
              if (status === 'OK' && results[0]) {
                setConfirmedAddress(results[0].formatted_address);
              }
            }
          );
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    };

    if (window.google) {
      initMap();
    } else {
      // Load Google Maps if not loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [isOpen, currentLat, currentLng]);

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
                Arrastra el marcador para ajustar la ubicación exacta
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

        {/* Map */}
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-80"
            style={{ minHeight: '320px' }}
          />
          
          {/* Crosshair overlay (optional visual aid) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-2 border-[#e4007c] rounded-full bg-white bg-opacity-80 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#e4007c] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Address display */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-[#e4007c] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Dirección confirmada:</p>
              <p className="text-sm text-gray-600 mt-1">{confirmedAddress}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coordenadas: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </p>
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