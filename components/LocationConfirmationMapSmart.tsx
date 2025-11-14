// components/LocationConfirmationMapSmart.tsx
// Componente inteligente que usa Google Maps si está disponible, sino usa EdgeFunction

'use client';

import { useState, useEffect } from 'react';
import LocationConfirmationMapInteractive from './LocationConfirmationMapInteractive';
import LocationConfirmationMapEdgeFunction from './LocationConfirmationMapEdgeFunction';

interface LocationConfirmationMapProps {
  address: string;
  initialLat?: number;
  initialLng?: number;
  onLocationConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function LocationConfirmationMapSmart(props: LocationConfirmationMapProps) {
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!props.isOpen) return;

    const checkGoogleMapsAvailability = () => {
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      // Use interactive map if API key is available
      if (googleMapsApiKey && !googleMapsApiKey.includes('supabase.co')) {
        console.log('✅ Using interactive Google Maps');
        setUseGoogleMaps(true);
      } else {
        console.log('🔄 Using static map (Edge Function)');
        setUseGoogleMaps(false);
      }
      
      setIsChecking(false);
    };

    checkGoogleMapsAvailability();
  }, [props.isOpen]);

  if (!props.isOpen) return null;

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Inicializando mapa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (useGoogleMaps) {
    return <LocationConfirmationMapInteractive {...props} />;
  } else {
    return <LocationConfirmationMapEdgeFunction {...props} />;
  }
}