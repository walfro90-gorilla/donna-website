// lib/utils/testEdgeFunction.ts
// Función para probar la edge function desde el código

import { GoogleMapsProxy } from './googleMapsProxy';

export const testEdgeFunction = async () => {
  console.log('🧪 Testing edge function...');

  try {
    // Test 1: Autocomplete
    console.log('📍 Testing autocomplete...');
    const autocompleteResult = await GoogleMapsProxy.getPlaceAutocomplete({
      input: 'tacos juarez',
      components: 'country:mx',
      types: 'establishment|geocode',
      language: 'es'
    });
    
    console.log('✅ Autocomplete result:', autocompleteResult);

    // Test 2: Place details (if we got results)
    if (autocompleteResult.predictions && autocompleteResult.predictions.length > 0) {
      const firstPlace = autocompleteResult.predictions[0];
      console.log('📍 Testing place details for:', firstPlace.description);
      
      const detailsResult = await GoogleMapsProxy.getPlaceDetails({
        placeId: firstPlace.place_id,
        fields: ['geometry', 'formatted_address', 'name', 'types']
      });
      
      console.log('✅ Place details result:', detailsResult);
      
      // Extract coordinates
      const coordinates = GoogleMapsProxy.extractCoordinates(detailsResult);
      console.log('📍 Extracted coordinates:', coordinates);
    }

    // Test 3: Reverse geocode
    console.log('📍 Testing reverse geocode...');
    const reverseResult = await GoogleMapsProxy.reverseGeocode(31.7764, -106.4245);
    console.log('✅ Reverse geocode result:', reverseResult);

    return { success: true, message: 'All tests passed!' };

  } catch (error) {
    console.error('❌ Edge function test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Para usar en la consola del navegador:
// import { testEdgeFunction } from '@/lib/utils/testEdgeFunction';
// testEdgeFunction();