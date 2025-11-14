// components/LocationConfirmationMapGoogle.tsx
// Mapa de confirmación que usa Google Maps API directamente

'use client';

import { useState, useEffect, useRef } from 'react';

// Extend Window interface for Google Maps
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

export default function LocationConfirmationMapGoogle({
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
  const geocoderRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    if (!isOpen) return;

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey || googleMapsApiKey.includes('supabase.co')) {
      console.log('⚠️ Google Maps API key not configured');
      return;
    }

    const loadGoogleMaps = () => {
      // Update coordinates if provided
      if (initialLat && initialLng) {
        console.log('📍 Setting initial coordinates:', { lat: initialLat, lng: initialLng });
        setCurrentLat(initialLat);
        setCurrentLng(initialLng);
      }

      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('✅ Google Maps loaded successfully');
          setMapLoaded(true);
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            initializeMap();
          }, 100);
        };
        script.onerror = () => {
          console.error('❌ Failed to load Google Maps');
        };
        document.head.appendChild(script);
      } else if (window.google) {
        console.log('✅ Google Maps already loaded');
        setMapLoaded(true);
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          initializeMap();
        }, 100);
      }
    };

    loadGoogleMaps();
  }, [isOpen, initialLat, initialLng]);

  // Force map resize when modal opens
  useEffect(() => {
    if (isOpen && mapInstanceRef.current && window.google) {
      setTimeout(() => {
        console.log('🔄 Triggering map resize...');
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
        mapInstanceRef.current.setCenter({ lat: currentLat, lng: currentLng });
      }, 300);
    }
  }, [isOpen, mapLoaded]);

  // Initialize map
  const initializeMap = () => {
    console.log('🗺️ Initializing map...');
    
    if (!mapRef.current) {
      console.error('❌ Map container not found');
      return;
    }
    
    if (!window.google) {
      console.error('❌ Google Maps not loaded');
      return;
    }

    try {
      // Initialize geocoder
      geocoderRef.current = new window.google.maps.Geocoder();
      console.log('✅ Geocoder initialized');

      // Create map
      const mapOptions = {
        center: { lat: currentLat, lng: currentLng },
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      console.log('🗺️ Creating map with options:', mapOptions);
      console.log('🗺️ Map container dimensions:', {
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
        clientWidth: mapRef.current.clientWidth,
        clientHeight: mapRef.current.clientHeight
      });
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      console.log('✅ Map instance created:', mapInstanceRef.current);
      
      // Wait for map to be ready
      window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'idle', () => {
        console.log('✅ Map is ready and idle');
        
        // Create marker with default red pin
        markerRef.current = new window.google.maps.Marker({
          position: { lat: currentLat, lng: currentLng },
          map: mapInstanceRef.current,
          draggable: true,
          title: 'Ubicación del restaurante - Arrastra para ajustar',
          animation: window.google.maps.Animation.DROP
        });

        console.log('✅ Marker created');

        // Handle marker drag
        markerRef.current.addListener('dragend', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          console.log('📍 Marker dragged to:', lat, lng);
          setCurrentLat(lat);
          setCurrentLng(lng);
          updateAddressFromCoordinates(lat, lng);
        });

        // Handle map click
        mapInstanceRef.current.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          console.log('🖱️ Map clicked at:', lat, lng);
          setCurrentLat(lat);
          setCurrentLng(lng);
          
          // Update marker position
          markerRef.current.setPosition({ lat, lng });
          
          updateAddressFromCoordinates(lat, lng);
        });

        // Geocode initial address if no coordinates provided
        if (!initialLat || !initialLng) {
          geocodeAddress(address);
        }
      });

    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  };

  const geocodeAddress = (addressToGeocode: string) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { address: addressToGeocode },
      (results: any[], status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          setCurrentLat(lat);
          setCurrentLng(lng);
          setConfirmedAddress(results[0].formatted_address);
          
          // Update map and marker
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            markerRef.current.setPosition({ lat, lng });
          }
        }
      }
    );
  };

  const updateAddressFromCoordinates = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    setIsLoadingAddress(true);
    
    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: any[], status: any) => {
        setIsLoadingAddress(false);
        
        if (status === 'OK' && results[0]) {
          setConfirmedAddress(results[0].formatted_address);
        }
      }
    );
  };

  const handleConfirm = () => {
    onLocationConfirm(currentLat, currentLng, confirmedAddress);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Confirma tu ubicación</h3>
              <p className="text-sm text-gray-600 mt-1">
                Arrastra el marcador o haz clic en el mapa para ajustar la ubicación
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
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          {mapLoaded ? (
            <div
              ref={mapRef}
              className="w-full h-96 bg-gray-200"
              style={{ 
                minHeight: '400px',
                height: '400px',
                width: '100%'
              }}
            />
          ) : (
            <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando mapa...</p>
                <p className="text-xs text-gray-500 mt-2">Inicializando Google Maps...</p>
              </div>
            </div>
          )}
        </div>

        {/* Address and coordinates info */}
        <div className="p-6 space-y-4">
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
                <p className="text-sm font-medium text-blue-800">💡 Cómo usar el mapa</p>
                <p className="text-xs text-blue-600 mt-1">
                  • Arrastra el marcador rojo para mover la ubicación<br/>
                  • Haz clic en cualquier punto del mapa para colocar el marcador ahí<br/>
                  • La dirección se actualizará automáticamente
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