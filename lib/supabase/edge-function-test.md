# 🧪 Testing Google Maps Proxy Edge Function

## 📋 Cómo probar la edge function desde el navegador

### 1. **Abrir Developer Tools**
- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña `Console`

### 2. **Probar Autocomplete de Lugares**

```javascript
// Test 1: Places Autocomplete
const testAutocomplete = async () => {
  try {
    const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY3Z4ZmpzeXJudGlsY2JiY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODIwNTEsImV4cCI6MjA3MDQ1ODA1MX0.jjQXoi5Yvxl2BqR-QlOtjO9vJFWFg4YowjMXTw3WKA0'
      },
      body: JSON.stringify({
        action: 'autocomplete',
        input: 'tacos',
        components: 'country:mx',
        types: 'establishment|geocode',
        language: 'es'
      })
    });
    
    const result = await response.json();
    console.log('✅ Autocomplete Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Autocomplete Error:', error);
  }
};

// Ejecutar test
testAutocomplete();
```

### 3. **Probar Place Details**

```javascript
// Test 2: Place Details (usa un place_id del test anterior)
const testPlaceDetails = async (placeId) => {
  try {
    const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY3Z4ZmpzeXJudGlsY2JiY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODIwNTEsImV4cCI6MjA3MDQ1ODA1MX0.jjQXoi5Yvxl2BqR-QlOtjO9vJFWFg4YowjMXTw3WKA0'
      },
      body: JSON.stringify({
        action: 'place_details',
        place_id: placeId,
        fields: 'geometry,formatted_address,name,types,address_components',
        language: 'es'
      })
    });
    
    const result = await response.json();
    console.log('✅ Place Details Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Place Details Error:', error);
  }
};

// Ejemplo de uso (reemplaza con un place_id real)
// testPlaceDetails('ChIJdd4hrwug2EcRLuiSrL2nNSQ');
```

### 4. **Probar Geocoding**

```javascript
// Test 3: Geocoding
const testGeocode = async () => {
  try {
    const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY3Z4ZmpzeXJudGlsY2JiY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODIwNTEsImV4cCI6MjA3MDQ1ODA1MX0.jjQXoi5Yvxl2BqR-QlOtjO9vJFWFg4YowjMXTw3WKA0'
      },
      body: JSON.stringify({
        action: 'geocode',
        address: 'Av Juárez, Centro, Juárez, Chih., México',
        language: 'es'
      })
    });
    
    const result = await response.json();
    console.log('✅ Geocode Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Geocode Error:', error);
  }
};

// Ejecutar test
testGeocode();
```

## 🔍 **Posibles formatos de respuesta de la edge function**

### Formato 1: Respuesta directa de Google Maps
```json
{
  "predictions": [
    {
      "description": "Tacos El Güero, Calle Principal, Juárez, Chih., México",
      "place_id": "ChIJdd4hrwug2EcRLuiSrL2nNSQ",
      "types": ["restaurant", "food", "point_of_interest", "establishment"]
    }
  ],
  "status": "OK"
}
```

### Formato 2: Respuesta envuelta
```json
{
  "success": true,
  "data": {
    "predictions": [...],
    "status": "OK"
  }
}
```

### Formato 3: Error
```json
{
  "error": "API key not valid",
  "status": "REQUEST_DENIED"
}
```

## 🛠️ **Troubleshooting**

### Si la edge function no responde:

1. **Verificar URL**: Asegúrate de que la URL sea correcta
2. **Verificar headers**: El token de autorización debe ser válido
3. **Verificar payload**: El formato del body debe coincidir con lo que espera la función

### Si obtienes errores 404:

La edge function podría no estar desplegada o tener un nombre diferente. Prueba estas variantes:

```javascript
// Variante 1: Sin endpoint en el body
const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy/places/autocomplete', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({
    input: 'tacos',
    components: 'country:mx'
  })
});

// Variante 2: Como query parameters
const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy?endpoint=places/autocomplete&input=tacos&components=country:mx');

// Variante 3: Diferente estructura
const response = await fetch('https://cncvxfjsyrntilcbbcfi.supabase.co/functions/v1/google-maps-proxy', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({
    service: 'places',
    method: 'autocomplete',
    params: { input: 'tacos' }
  })
});
```

## 📝 **Próximos pasos**

1. **Ejecuta los tests** en la consola del navegador
2. **Comparte los resultados** para ajustar la implementación
3. **Identifica el formato** exacto que usa tu edge function
4. **Ajustaremos el código** según los resultados

Una vez que sepamos cómo responde tu edge function, podremos ajustar perfectamente la implementación para que funcione igual que en tu app móvil.