// components/LocationConfirmationMapEdgeFunction.tsx
// Mapa interactivo dark-theme con Leaflet + CartoDB Dark Matter tiles
// Sin dependencia de Google Maps API key — marker draggable actualiza coordenadas

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [leafletReady, setLeafletReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Leaflet CSS + JS from CDN once
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;

    const L = (window as any).L;
    if (L) {
      setLeafletReady(true);
      return;
    }

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[src*="leaflet"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setLeafletReady(true);
          clearInterval(interval);
        }
      }, 100);
    }
  }, [isOpen]);

  // Sync coordinates when modal opens with new props
  useEffect(() => {
    if (!isOpen) return;
    if (initialLat) setCurrentLat(initialLat);
    if (initialLng) setCurrentLng(initialLng);
    setConfirmedAddress(address);
  }, [isOpen, initialLat, initialLng, address]);

  const updateAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const result = await GoogleMapsProxy.reverseGeocode(lat, lng);
      if (result.results?.[0]?.formatted_address) {
        setConfirmedAddress(result.results[0].formatted_address);
      }
    } catch {
      // keep current address if reverse geocode fails
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // Initialize Leaflet map once ready
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || !isOpen) return;

    // Destroy previous instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const L = (window as any).L;
    const lat = initialLat || currentLat;
    const lng = initialLng || currentLng;

    // Init map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark tile layer — CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    // Custom pink circle marker
    const pinkIcon = L.divIcon({
      html: `
        <div style="
          width:22px;height:22px;
          background:#e4007c;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 0 0 3px rgba(228,0,124,0.35), 0 2px 8px rgba(0,0,0,0.5);
        "></div>
      `,
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: pinkIcon,
    }).addTo(map);

    // Drag end → update coords + address
    marker.on('dragend', async (e: any) => {
      const { lat: newLat, lng: newLng } = e.target.getLatLng();
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      await updateAddressFromCoords(newLat, newLng);
    });

    // Click on map → move marker + update coords
    map.on('click', async (e: any) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      marker.setLatLng([newLat, newLng]);
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      await updateAddressFromCoords(newLat, newLng);
    });

    // Fix tiles not rendering on first open
    setTimeout(() => map.invalidateSize(), 100);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  // Only re-init when leaflet becomes ready or modal opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, isOpen]);

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
          {!leafletReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-8 h-8 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Cargando mapa...</p>
            </div>
          )}
          {/* Leaflet mounts here */}
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ opacity: leafletReady ? 1 : 0 }}
          />

          {/* Coordinates badge over map */}
          {leafletReady && (
            <div className="absolute bottom-3 left-3 z-[1000] bg-black/65 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-[#e4007c] animate-pulse" />
              <span className="text-white text-xs font-mono tabular-nums">
                {currentLat.toFixed(6)},&nbsp;{currentLng.toFixed(6)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Confirmed address */}
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

          {/* Read-only coordinate display */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Coordenadas</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Latitud</label>
                <div className="px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 text-sm font-mono select-all cursor-text">
                  {currentLat.toFixed(7)}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Longitud</label>
                <div className="px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 text-sm font-mono select-all cursor-text">
                  {currentLng.toFixed(7)}
                </div>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl px-3.5 py-3">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arrastra el pin rosa o toca cualquier punto del mapa. Las coordenadas se actualizarán automáticamente.
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
