// components/LocationConfirmationMapInteractive.tsx
// Mapa interactivo con Google Maps JavaScript API

'use client';

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

interface LocationConfirmationMapProps {
  address: string;
  initialLat?: number;
  initialLng?: number;
  onLocationConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function LocationConfirmationMapInteractive({
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
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Update coordinates when props change
  useEffect(() => {
    if (initialLat && initialLng) {
      console.log('📍 Setting coordinates:', { lat: initialLat, lng: initialLng });
      setCurrentLat(initialLat);
      setCurrentLng(initialLng);
      setConfirmedAddress(address);
    }
  }, [initialLat, initialLng, address]);

  // Load Google Maps
  useEffect(() => {
    if (!isOpen) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ No Google Maps API key');
      return;
    }

    const checkGoogleMapsReady = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        console.log('✅ Google Maps fully loaded and ready');
        setMapLoaded(true);
        return true;
      }
      return false;
    };

    if (typeof window !== 'undefined') {
      // Check if already loaded
      if (checkGoogleMapsReady()) {
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('⏳ Google Maps script already loading, waiting...');
        // Wait for it to load
        const interval = setInterval(() => {
          if (checkGoogleMapsReady()) {
            clearInterval(interval);
          }
        }, 100);
        return;
      }

      // Load new script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google Maps script loaded');
        // Wait a bit for full initialization
        setTimeout(() => {
          if (checkGoogleMapsReady()) {
            console.log('✅ Google Maps ready after script load');
          }
        }, 100);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps');
      };
      document.head.appendChild(script);
    }
  }, [isOpen]);

  // Initialize map when loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !isOpen) return;
    
    // Double check Google Maps is ready
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.error('❌ Google Maps not ready yet');
      return;
    }

    console.log('🗺️ Initializing map at:', { lat: currentLat, lng: currentLng });

    try {
      // Create map with simple configuration
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: currentLat, lng: currentLng },
        zoom: 17,
        mapTypeControl: true,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false
      });

      // Create custom pink marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Arrastra para ajustar la ubicación',
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#e4007c',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      console.log('✅ Map and marker created');

      // Handle marker drag
      markerRef.current.addListener('dragend', async (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log('📍 Marker dragged to:', { lat, lng });
        
        setCurrentLat(lat);
        setCurrentLng(lng);
        
        // Update address
        await updateAddressFromCoordinates(lat, lng);
      });

      // Handle map click
      mapInstanceRef.current.addListener('click', async (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log('🖱️ Map clicked at:', { lat, lng });
        
        setCurrentLat(lat);
        setCurrentLng(lng);
        
        // Move marker
        markerRef.current.setPosition({ lat, lng });
        
        // Update address
        await updateAddressFromCoordinates(lat, lng);
      });

    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }, [mapLoaded, isOpen, currentLat, currentLng]);

  const updateAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    
    try {
      const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'reverse_geocode',
          latlng: `${lat},${lng}`,
          language: 'es'
        })
      });

      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        const newAddress = result.results[0].formatted_address;
        console.log('✅ Address updated:', newAddress);
        setConfirmedAddress(newAddress);
      }
    } catch (error) {
      console.error('❌ Error updating address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleConfirm = () => {
    console.log('✅ Confirming location:', { lat: currentLat, lng: currentLng, address: confirmedAddress });
    onLocationConfirm(currentLat, currentLng, confirmedAddress);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Confirma tu ubicación</h3>
              <p className="text-sm text-gray-600 mt-1">
                Arrastra el pin rosa o haz clic en el mapa para ajustar
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

        {/* Map Container */}
        <div className="relative bg-gray-100 flex-shrink-0">
          {mapLoaded ? (
            <div
              ref={mapRef}
              className="w-full bg-gray-200"
              style={{ 
                height: '350px',
                width: '100%'
              }}
            />
          ) : (
            <div className="w-full bg-gray-100 flex items-center justify-center" style={{ height: '350px' }}>
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando mapa interactivo...</p>
              </div>
            </div>
          )}
        </div>

        {/* Address and coordinates info */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {/* Address display */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">💡 Cómo ajustar la ubicación</p>
                <p className="text-xs text-blue-600 mt-1">
                  • Arrastra el pin rosa para mover la ubicación<br/>
                  • Haz clic en cualquier punto del mapa<br/>
                  • Usa los controles de zoom para acercarte<br/>
                  • La dirección se actualizará automáticamente
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex space-x-3 flex-shrink-0 bg-white">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoadingAddress}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#e4007c] to-pink-500 text-white rounded-xl font-medium hover:from-[#c6006b] hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  );
}