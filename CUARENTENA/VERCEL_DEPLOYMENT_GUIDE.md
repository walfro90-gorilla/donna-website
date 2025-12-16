# Guía de Despliegue en Vercel - Variables de Entorno

## 🔴 Problema Actual

El mapa de Google Maps no se muestra en producción (Vercel) porque falta configurar las variables de entorno.

## ✅ Solución: Configurar Variables en Vercel

### Paso 1: Acceder a la Configuración de Variables

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar las Variables de Entorno

Agrega las siguientes 3 variables:

#### 1. NEXT_PUBLIC_SUPABASE_URL
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://cncvxfjsyrntilcbbcfi.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY3Z4ZmpzeXJudGlsY2JiY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODIwNTEsImV4cCI6MjA3MDQ1ODA1MX0.jjQXoi5Yvxl2BqR-QlOtjO9vJFWFg4YowjMXTw3WKA0
Environments: ✅ Production ✅ Preview ✅ Development
```

⚠️ **ADVERTENCIA DE VERCEL**: Vercel te mostrará una advertencia sobre `NEXT_PUBLIC_SUPABASE_ANON_KEY` diciendo que podría comprometer la seguridad. **ESTO ES NORMAL Y SEGURO** porque:
- La Anon Key de Supabase está diseñada para ser pública
- Supabase protege tu base de datos con Row Level Security (RLS)
- Esta key solo permite operaciones que tú defines en las políticas RLS

#### 3. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ⭐ (LA QUE FALTA)
```
Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: AIzaSyAH5kg3KoCEIxP9ljVnLbF6cwkOebBp0hE
Environments: ✅ Production ✅ Preview ✅ Development
```

⚠️ **ADVERTENCIA DE VERCEL**: Vercel también te mostrará una advertencia sobre esta variable. **ESTO ES NORMAL Y SEGURO** porque:
- Google Maps API Key está diseñada para ser pública (se usa en el navegador)
- Google protege tu API key mediante restricciones de dominio y API
- Solo tu dominio puede usar esta key (configurado en Google Cloud Console)

### Paso 3: Guardar y Redesplegar

1. Haz clic en **Save** después de agregar cada variable
2. Ve a **Deployments**
3. Encuentra el último deployment
4. Haz clic en los tres puntos (...) → **Redeploy**
5. Selecciona **Use existing Build Cache** (más rápido)
6. Haz clic en **Redeploy**

## 🔒 Seguridad: ¿Por qué es seguro usar NEXT_PUBLIC_?

### Variables NEXT_PUBLIC_ son PÚBLICAS
- Se incluyen en el bundle de JavaScript del cliente
- Cualquiera puede verlas en el navegador (DevTools → Sources)
- Por eso Vercel te advierte

### ¿Cuándo es SEGURO usar NEXT_PUBLIC_?

✅ **SEGURO** (como en nuestro caso):
- **Supabase Anon Key**: Diseñada para ser pública, protegida por RLS
- **Google Maps API Key**: Diseñada para ser pública, protegida por restricciones de dominio

❌ **NUNCA uses NEXT_PUBLIC_ para**:
- Claves privadas de API
- Tokens de autenticación de servidor
- Credenciales de base de datos
- Secrets de OAuth
- Service Account Keys

### Protección de Google Maps API Key

Para asegurar que solo tu dominio use tu API key:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en tu API Key
5. En **Application restrictions**:
   - Selecciona **HTTP referrers (web sites)**
   - Agrega tus dominios:
     ```
     https://dona.app/*
     https://*.dona.app/*
     https://*.vercel.app/*
     http://localhost:3000/*
     ```
6. En **API restrictions**:
   - Selecciona **Restrict key**
   - Marca solo:
     - Maps JavaScript API
     - Places API
     - Geocoding API
7. Haz clic en **Save**

## 🧪 Verificar que Funciona

Después del redespliegue:

1. Ve a tu sitio en producción: `https://dona.app/socios` (o tu dominio)
2. Completa el formulario de registro de restaurante
3. Agrega una dirección usando el autocompletado
4. Selecciona una dirección
5. **El modal debe mostrar el mapa** ✅

### Si el mapa NO aparece:

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Busca errores relacionados con Google Maps:
   ```
   ❌ Google Maps JavaScript API error: RefererNotAllowedMapError
   → Solución: Agrega tu dominio a las restricciones en Google Cloud Console
   
   ❌ Google Maps JavaScript API error: ApiNotActivatedMapError
   → Solución: Activa la API en Google Cloud Console
   
   ❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada
   → Solución: Verifica que agregaste la variable en Vercel y redesplegaste
   ```

## 📋 Checklist de Despliegue

- [ ] Agregar `NEXT_PUBLIC_SUPABASE_URL` en Vercel
- [ ] Agregar `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel
- [ ] Agregar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en Vercel ⭐
- [ ] Configurar restricciones de dominio en Google Cloud Console
- [ ] Redesplegar el proyecto en Vercel
- [ ] Probar el formulario de registro en producción
- [ ] Verificar que el mapa se muestra correctamente

## 🎯 Resumen

**Problema**: El mapa no se muestra en producción
**Causa**: Falta `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en Vercel
**Solución**: Agregar la variable en Vercel y redesplegar
**Advertencia de Vercel**: Es normal y seguro para API keys públicas
**Protección**: Configurar restricciones de dominio en Google Cloud Console

## 📚 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Maps API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Supabase Client Keys](https://supabase.com/docs/guides/api#api-url-and-keys)
