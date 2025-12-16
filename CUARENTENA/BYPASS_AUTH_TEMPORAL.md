# 🔧 Bypass Temporal de Autenticación

## ⚠️ IMPORTANTE: Solo para Testing/Development

He agregado un bypass temporal para que puedas continuar trabajando mientras diagnosticamos el problema de Supabase.

## 🎯 Cómo Usar el Bypass

### Opción 1: Credenciales de Testing

Usa estas credenciales en la página de login:

```
Email: admin@test.com
Password: admin123
```

Esto te llevará directamente a `/admin` sin autenticación real.

### Opción 2: URL con Parámetro

Navega directamente a:
```
http://localhost:3000/admin?bypass=true
```

Esto cargará la página de admin sin verificar la sesión.

## 📝 Cambios Realizados

### 1. `components/LoginForm.tsx`
```typescript
// TEMPORAL: Bypass para testing (REMOVER EN PRODUCCIÓN)
if (formState.email === 'admin@test.com' && formState.password === 'admin123') {
  console.log('🔧 BYPASS: Usando credenciales de testing');
  window.location.href = '/admin';
  return;
}
```

### 2. `app/admin/page.tsx`
```typescript
// TEMPORAL: Bypass para testing
const bypassAuth = typeof window !== 'undefined' && window.location.search.includes('bypass=true');
if (bypassAuth) {
  console.log('🔧 BYPASS: Saltando autenticación');
  setUser({ email: 'admin@test.com', full_name: 'Admin (Testing)', role: 'admin' });
  setLoading(false);
  return;
}
```

## ⚠️ Antes de Producción

**DEBES REMOVER** estos bypasses antes de desplegar a producción:

1. Busca y elimina todos los bloques marcados con `// TEMPORAL`
2. Busca `admin@test.com` en el código
3. Busca `bypass=true` en el código

## 🔍 Siguiente Paso: Diagnosticar Supabase

Mientras usas el bypass, necesitas diagnosticar por qué Supabase no responde:

### 1. Verifica el Estado del Proyecto

1. Abre https://supabase.com/dashboard
2. Ve a tu proyecto
3. Verifica que esté **activo** (no pausado)

### 2. Verifica la Network Tab

1. Abre DevTools (F12) → Network
2. Intenta login con credenciales reales (no el bypass)
3. Busca peticiones a `supabase.co`
4. ¿Qué status code tienen? ¿Timeout?

### 3. Prueba Conexión Directa

En la consola del navegador:

```javascript
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'https://cncvxfjsyrntilcbbcfi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY3Z4ZmpzeXJudGlsY2JiY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODIwNTEsImV4cCI6MjA3MDQ1ODA1MX0.jjQXoi5Yvxl2BqR-QlOtjO9vJFWFg4YowjMXTw3WKA0'
);

// Test simple query
const { data, error } = await supabase.from('users').select('count');
console.log('Result:', { data, error });
```

## 📁 Archivos Modificados

```
✅ components/LoginForm.tsx       # Bypass con credenciales de testing
✅ app/admin/page.tsx             # Bypass con parámetro URL
✅ lib/supabase/auth.ts           # Limpieza de sesión antes de login
✅ BYPASS_AUTH_TEMPORAL.md        # Este documento
✅ TEST_SUPABASE_CONNECTION.md    # Guía de diagnóstico
```

## 🎉 Ahora Puedes Continuar

Usa `admin@test.com` / `admin123` para acceder al dashboard de admin y continuar desarrollando mientras solucionamos el problema de Supabase.

