// lib/utils/googleMapsProxy.ts
// Utilidades para interactuar con la edge function google-maps-proxy

interface PlaceDetailsParams {
  placeId: string;
  fields?: string[];
}

interface GeocodeParams {
  address?: string;
  latlng?: string;
}

interface PlaceAutocompleteParams {
  input: string;
  components?: string;
  types?: string;
  language?: string;
}

export class GoogleMapsProxy {
  private static baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-maps-proxy`;
  private static headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  };

  /**
   * Get place autocomplete suggestions
   */
  static async getPlaceAutocomplete(params: PlaceAutocompleteParams) {
    try {
      console.log('🚀 Calling edge function with params:', {
        action: 'autocomplete',
        input: params.input,
        components: params.components || 'country:mx',
        types: params.types || 'establishment|geocode',
        language: params.language || 'es'
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action: 'autocomplete',
          input: params.input,
          components: params.components || 'country:mx',
          types: params.types || 'establishment|geocode',
          language: params.language || 'es'
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const result = await response.json();
      console.log('📦 Raw response from edge function:', result);

      if (!response.ok) {
        console.error('❌ Edge function returned error:', result);
        throw new Error(result.error || `Edge function failed with status ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('💥 Error in getPlaceAutocomplete:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a place
   */
  static async getPlaceDetails(params: PlaceDetailsParams) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action: 'place_details',
          place_id: params.placeId,
          fields: params.fields?.join(',') || 'geometry,formatted_address,name,types,address_components',
          language: 'es'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Edge function failed');
      }

      return result;
    } catch (error) {
      console.error('Error in getPlaceDetails:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  static async geocode(params: GeocodeParams) {
    try {
      const actionType = params.latlng ? 'reverse_geocode' : 'geocode';
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action: actionType,
          address: params.address,
          latlng: params.latlng,
          language: 'es'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Edge function failed');
      }

      return result;
    } catch (error) {
      console.error('Error in geocode:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  static async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action: 'reverse_geocode',
          latlng: `${lat},${lng}`,
          language: 'es'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Edge function failed');
      }

      return result;
    } catch (error) {
      console.error('Error in reverseGeocode:', error);
      throw error;
    }
  }

  /**
   * Extract coordinates from place details response
   */
  static extractCoordinates(placeDetails: any): { lat: number; lng: number } | null {
    try {
      console.log('🔍 Extracting coordinates from:', placeDetails);
      
      // Try different possible structures
      const geometry = placeDetails.result?.geometry || 
                      placeDetails.geometry || 
                      placeDetails.data?.result?.geometry ||
                      placeDetails.data?.geometry;
      
      if (geometry && geometry.location) {
        const coords = {
          lat: geometry.location.lat,
          lng: geometry.location.lng
        };
        console.log('✅ Extracted coordinates:', coords);
        return coords;
      }
      
      console.warn('⚠️ No coordinates found in place details');
      return null;
    } catch (error) {
      console.error('❌ Error extracting coordinates:', error);
      return null;
    }
  }

  /**
   * Extract formatted address from place details
   */
  static extractAddress(placeDetails: any): string | null {
    try {
      return placeDetails.result?.formatted_address || 
             placeDetails.formatted_address || 
             null;
    } catch (error) {
      console.error('Error extracting address:', error);
      return null;
    }
  }

  /**
   * Create structured address object from place details
   */
  static createStructuredAddress(placeDetails: any): any {
    try {
      const result = placeDetails.result || placeDetails;
      const components = result.address_components || [];
      
      const structured: any = {
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        types: result.types || []
      };

      // Extract address components
      if (Array.isArray(components)) {
        components.forEach((component: any) => {
          const types = component.types || [];
          
          if (types.includes('street_number')) {
            structured.street_number = component.long_name;
          }
          if (types.includes('route')) {
            structured.route = component.long_name;
          }
          if (types.includes('locality')) {
            structured.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            structured.state = component.long_name;
          }
          if (types.includes('country')) {
            structured.country = component.long_name;
            structured.country_code = component.short_name;
          }
          if (types.includes('postal_code')) {
            structured.postal_code = component.long_name;
          }
        });
      }

      return structured;
    } catch (error) {
      console.error('Error creating structured address:', error);
      return null;
    }
  }
}