// lib/utils/testGoogleMapsAPI.ts
// Script para probar que Google Maps API funciona correctamente

export const testGoogleMapsAPI = async () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada');
    return false;
  }

  console.log('🔑 API Key configurada:', apiKey.substring(0, 10) + '...');

  // Check if Google Maps is loaded
  if (typeof window === 'undefined' || !window.google) {
    console.log('⚠️ Google Maps JavaScript API no está cargada');
    console.log('💡 Intenta usar el autocompletado de direcciones para cargar la API primero');
    return false;
  }

  try {
    console.log('🧪 Probando Google Maps JavaScript API...');

    // Test 1: Geocoder
    if (window.google.maps.Geocoder) {
      console.log('✅ Geocoder disponible');
      
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve) => {
        geocoder.geocode(
          { address: 'Ciudad de México, México' },
          (results: any[], status: any) => {
            if (status === 'OK' && results && results.length > 0) {
              console.log('✅ Geocoding funciona correctamente');
              console.log('📍 Resultado:', results[0].formatted_address);
              console.log('📍 Coordenadas:', results[0].geometry.location.lat(), results[0].geometry.location.lng());
              
              // Test 2: Places Service
              if (window.google.maps.places && window.google.maps.places.PlacesService) {
                console.log('✅ Places Service disponible');
                
                const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                
                service.textSearch(
                  {
                    query: 'restaurante en Ciudad de México',
                    location: results[0].geometry.location,
                    radius: 5000
                  },
                  (placesResults: any[], placesStatus: any) => {
                    if (placesStatus === window.google.maps.places.PlacesServiceStatus.OK && placesResults) {
                      console.log('✅ Places Search funciona correctamente');
                      console.log('🏪 Encontrados:', placesResults.length, 'lugares');
                      console.log('🏪 Primer resultado:', placesResults[0]?.name);
                      console.log('🎉 ¡Todas las APIs de Google Maps funcionan correctamente!');
                      resolve(true);
                    } else {
                      console.error('❌ Error en Places Search:', placesStatus);
                      resolve(false);
                    }
                  }
                );
              } else {
                console.log('⚠️ Places Service no disponible, pero Geocoding funciona');
                console.log('🎉 ¡Google Maps API básica funciona correctamente!');
                resolve(true);
              }
            } else {
              console.error('❌ Error en Geocoding:', status);
              resolve(false);
            }
          }
        );
      });
    } else {
      console.error('❌ Geocoder no disponible');
      return false;
    }

  } catch (error) {
    console.error('❌ Error al probar Google Maps API:', error);
    return false;
  }
};

// Función para probar desde el navegador
export const testInBrowser = () => {
  if (typeof window !== 'undefined') {
    testGoogleMapsAPI().then(success => {
      if (success) {
        alert('✅ Google Maps API funciona correctamente! Revisa la consola para más detalles.');
      } else {
        alert('❌ Hay problemas con Google Maps API. Revisa la consola para más detalles.');
      }
    });
  }
};