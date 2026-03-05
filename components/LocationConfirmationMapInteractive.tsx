// components/LocationConfirmationMapInteractive.tsx
// Mapa interactivo dark-theme con Google Maps JavaScript API

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

  // Sync props when modal opens
  useEffect(() => {
    if (initialLat && initialLng) {
      setCurrentLat(initialLat);
      setCurrentLng(initialLng);
      setConfirmedAddress(address);
    }
  }, [initialLat, initialLng, address]);

  // Load Google Maps script
  useEffect(() => {
    if (!isOpen) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const checkReady = () => {
      if (window.google?.maps?.Map) {
        setMapLoaded(true);
        return true;
      }
      return false;
    };

    if (typeof window === 'undefined') return;
    if (checkReady()) return;

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const interval = setInterval(() => {
        if (checkReady()) clearInterval(interval);
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setTimeout(() => checkReady(), 100);
    script.onerror = () => console.error('Failed to load Google Maps');
    document.head.appendChild(script);
  }, [isOpen]);

  // Initialize map once loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !isOpen) return;
    if (!window.google?.maps?.Map) return;

    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: currentLat, lng: currentLng },
        zoom: 17,
        mapTypeControl: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
          { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba4' }] },
          { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
          { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
        ]
      });

      markerRef.current = new window.google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Arrastra para ajustar la ubicación',
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#e4007c',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      markerRef.current.addListener('dragend', async (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setCurrentLat(lat);
        setCurrentLng(lng);
        await updateAddressFromCoordinates(lat, lng);
      });

      mapInstanceRef.current.addListener('click', async (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setCurrentLat(lat);
        setCurrentLng(lng);
        markerRef.current.setPosition({ lat, lng });
        await updateAddressFromCoordinates(lat, lng);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [mapLoaded, isOpen]);

  const updateAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ action: 'reverse_geocode', latlng: `${lat},${lng}`, language: 'es' })
      });
      const result = await response.json();
      if (result.results?.length > 0) {
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
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-[#111827] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">Confirma la ubicación</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Arrastra el pin o toca el mapa para ajustar
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div className="relative bg-gray-800 h-56 sm:h-72 flex-shrink-0">
          {mapLoaded ? (
            <div ref={mapRef} className="w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Cargando mapa...</p>
            </div>
          )}

          {/* Coordinates badge */}
          {mapLoaded && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#e4007c] animate-pulse" />
              <span className="text-white text-xs font-mono">
                {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Address */}
          <div className="bg-gray-800 rounded-xl p-3.5 border border-gray-700">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-[#e4007c] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Dirección</p>
                {isLoadingAddress ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Actualizando...</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-200 leading-snug">{confirmedAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl px-3.5 py-3">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arrastra el pin rosa o toca cualquier punto del mapa para mover la ubicación. La dirección se actualizará automáticamente.
            </p>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4 py-4 border-t border-gray-700 bg-[#111827] flex-shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoadingAddress}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#e4007c] to-pink-500 text-white text-sm font-semibold hover:from-[#c6006b] hover:to-pink-600 transition-all shadow-lg shadow-pink-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingAddress ? 'Actualizando...' : 'Confirmar ubicación'}
          </button>
        </div>

      </div>
    </div>
  );
}
