# 🗺️ Habilitar Maps Static API

## ⚠️ El mapa no se muestra

Si ves el mensaje "Failed to load static map" en la consola, necesitas habilitar la **Maps Static API** en Google Cloud Console.

## 📋 Pasos para habilitar:

### 1. Ve a Google Cloud Console
https://console.cloud.google.com/

### 2. Selecciona tu proyecto
"Donna app" (o el proyecto que estés usando)

### 3. Busca "Maps Static API"
- En el buscador superior, escribe: **Maps Static API**
- Haz clic en el resultado

### 4. Habilita la API
- Haz clic en el botón **"ENABLE"** (Habilitar)
- Espera unos segundos a que se active

### 5. Verifica las APIs habilitadas

Deberías tener estas 4 APIs habilitadas:

✅ **Maps JavaScript API** - Para mapas interactivos  
✅ **Maps Static API** - Para imágenes estáticas de mapas  
✅ **Geocoding API** - Para convertir direcciones en coordenadas  
✅ **Places API** - Para autocompletado de direcciones  

## 🔄 Después de habilitar:

1. **Recarga la página** en el navegador (F5)
2. El mapa debería mostrarse correctamente
3. Si aún no funciona, espera 1-2 minutos (la API tarda en activarse)

## 💡 Alternativa temporal:

Mientras tanto, el sistema muestra un **fallback visual elegante** con:
- Icono animado de ubicación
- Coordenadas GPS visibles
- Mensaje de confirmación
- Diseño profesional con gradientes

El formulario funciona perfectamente incluso sin el mapa estático.

---

## 🔗 Enlaces útiles:

- **Google Cloud Console**: https://console.cloud.google.com/
- **Maps Static API Docs**: https://developers.google.com/maps/documentation/maps-static/overview
- **API Key Restrictions**: https://console.cloud.google.com/apis/credentials