# 🔧 Test de Conexión a Supabase

## Problema Actual

`signInWithPassword()` se está colgando y nunca responde (timeout después de 30s).

## Posibles Causas

1. **Proyecto de Supabase pausado** - Los proyectos gratuitos se pausan después de inactividad
2. **Problema de CORS** - Supabase no permite peticiones desde localhost
3. **Problema de red** - Firewall o antivirus bloqueando las peticiones
4. **Múltiples instancias** - Conflicto con el localStorage

## Pasos para Diagnosticar

### 1. Verificar Estado del Proyecto en Supabase

1. Abre **Supabase Dashboard**: https://supabase.com/dashboard
2. Ve a tu proyecto: `cncvxfjsyrntilcbbcfi`
3. Verifica que el proyecto esté **activo** (no pausado)
4. Si está pausado, haz click en "Resume project"

### 2. Verificar Configuración de Auth

1. En Supabase Dashboard → **Authentication** → **URL Configuration**
2. Verifica que `localhost:3000` esté en la lista de **Site URL** o **Redirect URLs**
3. Agrega si no está:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

### 3. Probar Conexión Directa

Abre la consola del navegador (F12) y ejecuta este código:

```javascript
// Test 1: Verificar que las variables de entorno están cargadas
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Test 2: Crear cliente y probar conexión
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'https://cncvxfjsyrntilcbbcfi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY3Z4ZmpzeXJudGlsY2JiY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODIwNTEsImV4cCI6MjA3MDQ1ODA1MX0.jjQXoi5Yvxl2BqR-QlOtjO9vJFWFg4YowjMXTw3WKA0'
);

// Test 3: Probar una consulta simple
const { data, error } = await supabase.from('users').select('count');
console.log('Test query result:', { data, error });

// Test 4: Probar signInWithPassword
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'admin@donna.app',
  password: 'TU_PASSWORD_AQUI'
});
console.log('Auth test result:', { authData, authError });
```

### 4. Limpiar LocalStorage

Si hay datos corruptos en el localStorage:

```javascript
// En la consola del navegador
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 5. Verificar en Network Tab

1. Abre DevTools (F12) → **Network** tab
2. Filtra por "supabase"
3. Intenta hacer login
4. Busca peticiones a `https://cncvxfjsyrntilcbbcfi.supabase.co/auth/v1/token?grant_type=password`
5. Verifica:
   - ¿La petición se envía?
   - ¿Cuál es el status code? (200, 400, 500, timeout?)
   - ¿Cuánto tiempo tarda?

## Soluciones Temporales

### Opción 1: Usar Credenciales Hardcodeadas (Solo para Testing)

Modifica temporalmente `lib/supabase/auth.ts`:

```typescript
// TEMPORAL - Solo para testing
const testSupabase = createClient(
  'https://cncvxfjsyrntilcbbcfi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  {
    auth: {
      persistSession: false, // No usar localStorage
      autoRefreshToken: false,
    }
  }
);

const { data, error } = await testSupabase.auth.signInWithPassword({
  email,
  password
});
```

### Opción 2: Bypass Auth (Solo para Development)

Crea un usuario mock para desarrollo:

```typescript
// En LoginForm.tsx - SOLO PARA TESTING
if (email === 'test@test.com' && password === 'test123') {
  router.push('/admin');
  return;
}
```

## Siguiente Paso

**Comparte los resultados de:**
1. ¿El proyecto de Supabase está activo?
2. ¿Qué ves en la Network tab cuando intentas login?
3. ¿Qué resultado da el test de conexión directa en la consola?

