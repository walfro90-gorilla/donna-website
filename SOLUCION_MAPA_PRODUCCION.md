# 🗺️ Solución: Mapa no se muestra en Producción

## 🔴 Problema

El formulario de registro de restaurante en producción (Vercel) no muestra el mapa de Google Maps cuando se selecciona una dirección, aunque en local funciona correctamente.

## ✅ Causa Raíz

**Falta la variable de entorno `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en Vercel.**

En local funciona porque tienes el archivo `.env.local` con la API key, pero Vercel no tiene acceso a este archivo. Necesitas configurar las variables de entorno directamente en Vercel.

## 🚀 Solución Rápida (3 pasos)

### 1. Ve a Vercel Dashboard
```
https://vercel.com/dashboard
→ Selecciona tu proyecto
→ Settings → Environment Variables
```

### 2. Agrega esta variable:
```
Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: AIzaSyAH5kg3KoCEIxP9ljVnLbF6cwkOebBp0hE
Environments: ✅ Production ✅ Preview ✅ Development
```

**⚠️ Vercel te mostrará una advertencia de seguridad - IGNÓRALA**

La advertencia dice:
> "This key, which is prefixed with NEXT_PUBLIC_ and includes the term KEY, might expose sensitive information to the browser. Verify it is safe to share publicly."

**Esto es NORMAL y SEGURO** porque:
- Google Maps API Key está diseñada para ser pública
- Se usa en el navegador del cliente
- Google la protege con restricciones de dominio

### 3. Redespliega
```
Deployments → Último deployment → ... → Redeploy
```

## 🔒 ¿Por qué es seguro?

### La advertencia de Vercel es correcta PERO...

Vercel advierte sobre variables `NEXT_PUBLIC_*` porque se exponen al navegador. Sin embargo, hay casos donde esto es **intencional y seguro**:

#### ✅ SEGURO (tu caso):
- **Google Maps API Key**: Diseñada para uso público
  - Protegida por restricciones de dominio (solo tu sitio puede usarla)
  - Protegida por restricciones de API (solo Google Maps APIs)
  - Cuotas y límites de uso configurables
  
- **Supabase Anon Key**: Diseñada para uso público
  - Protegida por Row Level Security (RLS)
  - Solo permite operaciones que defines en políticas

#### ❌ NUNCA uses NEXT_PUBLIC_ para:
- Claves privadas de API
- Tokens de autenticación de servidor
- Credenciales de base de datos
- Service Account Keys
- Secrets de OAuth

## 🛡️ Protección Adicional (Recomendado)

Para mayor seguridad, configura restricciones en Google Cloud Console:

### 1. Ve a Google Cloud Console
```
https://console.cloud.google.com/
→ Selecciona tu proyecto
→ APIs & Services → Credentials
→ Haz clic en tu API Key
```

### 2. Configura restricciones de dominio
```
Application restrictions:
  ☑️ HTTP referrers (web sites)
  
  Agregar:
  https://dona.app/*
  https://*.dona.app/*
  https://*.vercel.app/*
  http://localhost:3000/*
```

### 3. Configura restricciones de API
```
API restrictions:
  ☑️ Restrict key
  
  Seleccionar solo:
  ✅ Maps JavaScript API
  ✅ Places API
  ✅ Geocoding API
```

### 4. Guarda los cambios

Ahora tu API key **solo funcionará** en tus dominios y **solo** para Google Maps.

## 🧪 Verificar la Solución

### En Local:
```bash
npm run verify:env
```

Deberías ver:
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### En Producción:
1. Ve a `https://dona.app/socios` (o tu dominio)
2. Completa el formulario de registro
3. Agrega una dirección
4. Selecciona una dirección del autocompletado
5. **El modal debe mostrar el mapa** ✅

### Si NO funciona:

Abre DevTools (F12) → Console y busca errores:

```javascript
// Error: Dominio no permitido
❌ Google Maps JavaScript API error: RefererNotAllowedMapError
→ Solución: Agrega tu dominio en Google Cloud Console

// Error: API no activada
❌ Google Maps JavaScript API error: ApiNotActivatedMapError
→ Solución: Activa Maps JavaScript API en Google Cloud Console

// Error: Variable no configurada
❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada
→ Solución: Verifica que agregaste la variable en Vercel y redesplegaste
```

## 📋 Checklist Completo

### Variables en Vercel:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` agregada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` agregada
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` agregada ⭐
- [ ] Todas marcadas para Production, Preview, Development
- [ ] Proyecto redesplegado

### Restricciones en Google Cloud:
- [ ] Restricciones de dominio configuradas
- [ ] Restricciones de API configuradas
- [ ] Cambios guardados

### Pruebas:
- [ ] Script de verificación local pasa (`npm run verify:env`)
- [ ] Formulario funciona en producción
- [ ] Mapa se muestra correctamente
- [ ] No hay errores en Console

## 🎯 Resumen

| Aspecto | Estado |
|---------|--------|
| **Problema** | Mapa no se muestra en producción |
| **Causa** | Falta `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en Vercel |
| **Solución** | Agregar variable en Vercel y redesplegar |
| **Advertencia** | Normal y segura para API keys públicas |
| **Seguridad** | Protegida por restricciones de dominio |
| **Tiempo** | 5 minutos |

## 📚 Documentación Adicional

- **Guía completa**: `VERCEL_DEPLOYMENT_GUIDE.md`
- **Verificación local**: `npm run verify:env`
- **Next.js Env Vars**: https://nextjs.org/docs/basic-features/environment-variables
- **Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables
- **Google Maps Security**: https://developers.google.com/maps/api-key-best-practices

## 💡 Tip Final

Después de configurar las variables en Vercel, **siempre redespliega** el proyecto. Los cambios en variables de entorno no se aplican automáticamente a deployments existentes.

---

**¿Necesitas ayuda?** Revisa la consola del navegador en producción para ver errores específicos de Google Maps.
