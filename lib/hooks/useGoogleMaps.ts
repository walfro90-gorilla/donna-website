"use client";
import { useState, useEffect, useRef } from 'react';

interface GoogleMapsError {
  message: string;
  code?: string;
}

const useGoogleMaps = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<GoogleMapsError | null>(null);
  const errorSetRef = useRef(false);

  useEffect(() => {
    // Reset error state when API key changes
    setError(null);
    errorSetRef.current = false;

    // Check if API key is provided
    if (!apiKey || apiKey.trim() === '') {
      errorSetRef.current = true;
      setError({
        message: 'La clave de API de Google Maps no está configurada. Por favor, configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu archivo .env.local',
        code: 'MISSING_API_KEY'
      });
      return;
    }

    // If Google Maps is already loaded, mark as loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      // Another component is already loading the script
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
      return;
    }

    // Set up Google Maps authentication failure callback
    // This is the official way Google Maps reports API key errors
    (window as any).gm_authFailure = () => {
      if (!errorSetRef.current) {
        errorSetRef.current = true;
        setError({
          message: 'La clave de API de Google Maps no es válida. Por favor, verifica que la clave sea correcta y que tenga habilitada la API de Maps JavaScript.',
          code: 'INVALID_API_KEY'
        });
        console.error('Google Maps API authentication failed. Check your API key.');
      }
    };

    // Set up error handler for general errors
    const handleGoogleMapsError = (e: ErrorEvent) => {
      // Only handle errors related to Google Maps
      if (e.message && (
        e.message.includes('maps.googleapis.com') ||
        e.message.includes('InvalidKey') ||
        e.message.includes('Google Maps') ||
        e.message.includes('gm_authFailure')
      )) {
        const errorMessage = e.message;
        
        // Check for specific Google Maps API errors
        if (!errorSetRef.current) {
          errorSetRef.current = true;
          if (errorMessage.includes('InvalidKeyMapError') || errorMessage.includes('InvalidKey')) {
            setError({
              message: 'La clave de API de Google Maps no es válida. Por favor, verifica que la clave sea correcta y que tenga habilitada la API de Maps JavaScript.',
              code: 'INVALID_API_KEY'
            });
          } else if (errorMessage.includes('RefererNotAllowedMapError')) {
            setError({
              message: 'El dominio no está autorizado para usar esta clave de API. Configura las restricciones de dominio en Google Cloud Console.',
              code: 'REFERER_NOT_ALLOWED'
            });
          } else {
            setError({
              message: `Error al cargar Google Maps: ${errorMessage}`,
              code: 'LOAD_ERROR'
            });
          }
        }
        
        console.error('Google Maps API Error:', errorMessage);
      }
    };

    // Listen for JavaScript errors
    window.addEventListener('error', handleGoogleMapsError);

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Check if Google Maps loaded successfully
      setTimeout(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          setError(null);
          errorSetRef.current = false;
        } else {
          // If maps didn't load but script loaded, there might be an API key issue
          // Check for auth failure callback
          if ((window as any).gm_authFailure) {
            // The callback will be called by Google Maps if there's an auth error
            // Give it a moment to trigger
            setTimeout(() => {
              if (!isLoaded && !errorSetRef.current) {
                errorSetRef.current = true;
                setError({
                  message: 'Google Maps no se inicializó correctamente. Por favor, verifica tu clave de API.',
                  code: 'INIT_ERROR'
                });
              }
            }, 2000);
          }
        }
      }, 500);
    };

    script.onerror = () => {
      if (!errorSetRef.current) {
        errorSetRef.current = true;
        setError({
          message: 'No se pudo cargar el script de Google Maps. Verifica tu conexión a internet y la configuración de la API.',
          code: 'SCRIPT_LOAD_ERROR'
        });
      }
      console.error("Google Maps script failed to load.");
      window.removeEventListener('error', handleGoogleMapsError);
      if ((window as any).gm_authFailure) {
        delete (window as any).gm_authFailure;
      }
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      window.removeEventListener('error', handleGoogleMapsError);
      if ((window as any).gm_authFailure) {
        delete (window as any).gm_authFailure;
      }
    };

  }, [apiKey]);

  return { isLoaded, error };
};

export default useGoogleMaps;
