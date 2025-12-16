# 🐛 Debug: Problema de Login

## Cambios Realizados

### 1. Forzar Recarga Completa Después del Login

**Problema:** El `router.push()` no estaba refrescando la sesión correctamente.

**Solución:** Cambiado a `window.location.href` para forzar una recarga completa de la página.

```typescript
// Antes:
router.push(redirectPath);

// Después:
window.location.href = redirectPath;
```

### 2. Singleton para Cliente de Supabase

**Problema:** Múltiples instancias de GoTrueClient causaban advertencias y posibles conflictos.

**Solución:** Implementado patrón singleton en `lib/supabase/client.ts`.

```typescript
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  // ... crear instancia
}
```

## Pasos para Probar

### 1. Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Iniciar de nuevo
npm run dev
```

### 2. Limpiar Caché del Navegador

1. Abre DevTools (F12)
2. Haz clic derecho en el botón de recargar
3. Selecciona "Vaciar caché y recargar de forma forzada"

O usa:
- Chrome: `Ctrl + Shift + Delete`
- Firefox: `Ctrl + Shift + Delete`

### 3. Verificar Sesión en Supabase

Abre la consola del navegador y ejecuta:

```javascript
// Verificar si hay sesión
const { data } = await window.supabase.auth.getSession();
console.log('Sesión actual:', data);

// Verificar usuario
const { data: user } = await window.supabase.auth.getUser();
console.log('Usuario:', user);
```

### 4. Probar Login Paso a Paso

1. **Abre DevTools (F12) → Console**
2. **Ve a `/login`**
3. **Ingresa credenciales de admin**
4. **Observa la consola durante el login**

Deberías ver:
```
✅ Login exitoso
✅ Rol obtenido: admin
✅ Redirigiendo a: /admin
```

## Posibles Problemas y Soluciones

### Problema 1: "No redirige después del login"

**Diagnóstico:**
```javascript
// En la consola del navegador después del login
console.log('Sesión:', await supabase.auth.getSession());
```

**Soluciones:**
1. Verificar que el usuario existe en la tabla `users`
2. Verificar que el campo `role` es `'admin'`
3. Limpiar cookies y volver a intentar

### Problema 2: "Error: No role assigned"

**Causa:** El usuario no tiene un registro en la tabla `users` o el campo `role` está vacío.

**Solución:**
```sql
-- Verificar usuario en Supabase
SELECT * FROM users WHERE email = 'admin@donna.app';

-- Si no existe, crear:
INSERT INTO users (id, email, full_name, role, phone, created_at)
VALUES (
  'auth-user-id-from-auth-table',
  'admin@donna.app',
  'Admin User',
  'admin',
  '1234567890',
  NOW()
);

-- Si existe pero sin rol, actualizar:
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@donna.app';
```

### Problema 3: "Middleware no ejecuta"

**Diagnóstico:**
Agregar logs al middleware:

```typescript
// En middleware.ts, al inicio de la función
console.log('🔒 Middleware ejecutado para:', pathname);
```

**Solución:**
1. Verificar que el archivo `middleware.ts` está en la raíz del proyecto
2. Reiniciar el servidor de desarrollo
3. Verificar que la ruta está en el `matcher`

### Problema 4: "Session not found"

**Causa:** Las cookies de sesión no se están guardando correctamente.

**Solución:**
1. Verificar que las cookies están habilitadas en el navegador
2. Verificar que no hay extensiones bloqueando cookies
3. Probar en modo incógnito

## Verificación Manual

### 1. Verificar Usuario en Supabase

1. Ve a Supabase Dashboard
2. Authentication → Users
3. Busca tu usuario admin
4. Copia el ID del usuario

### 2. Verificar Registro en Tabla Users

1. Ve a Table Editor → users
2. Busca el registro con el ID del paso anterior
3. Verifica que el campo `role` sea `'admin'`

### 3. Verificar Variables de Entorno

```bash
npm run verify:env
```

Deberías ver:
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

## Script de Debug en el Navegador

Copia y pega esto en la consola del navegador después de hacer login:

```javascript
// Script de debug completo
(async () => {
  console.log('🔍 Iniciando debug de sesión...');
  
  // 1. Verificar cliente Supabase
  const supabase = window.supabase || createClient();
  console.log('✅ Cliente Supabase:', supabase ? 'OK' : 'ERROR');
  
  // 2. Verificar sesión
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log('📝 Sesión:', session);
  console.log('❌ Error de sesión:', sessionError);
  
  // 3. Verificar usuario
  if (session?.session?.user) {
    const userId = session.session.user.id;
    console.log('👤 User ID:', userId);
    
    // 4. Verificar rol en base de datos
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('👤 Datos del usuario:', userData);
    console.log('❌ Error de usuario:', userError);
    
    if (userData) {
      console.log('🎭 Rol:', userData.role);
      console.log('📧 Email:', userData.email);
      console.log('👤 Nombre:', userData.full_name);
    }
  } else {
    console.log('❌ No hay sesión activa');
  }
  
  console.log('✅ Debug completado');
})();
```

## Logs Esperados

### Login Exitoso:
```
🔍 Iniciando debug de sesión...
✅ Cliente Supabase: OK
📝 Sesión: { session: { user: {...}, access_token: '...' } }
❌ Error de sesión: null
👤 User ID: abc123...
👤 Datos del usuario: { id: 'abc123...', email: 'admin@donna.app', role: 'admin', ... }
❌ Error de usuario: null
🎭 Rol: admin
📧 Email: admin@donna.app
👤 Nombre: Admin User
✅ Debug completado
```

### Login con Problema:
```
🔍 Iniciando debug de sesión...
✅ Cliente Supabase: OK
📝 Sesión: { session: null }
❌ Error de sesión: null
❌ No hay sesión activa
✅ Debug completado
```

## Solución Rápida

Si nada funciona, prueba esto:

1. **Cerrar todas las pestañas del navegador**
2. **Limpiar cookies y caché completamente**
3. **Reiniciar el servidor de desarrollo**
4. **Abrir en modo incógnito**
5. **Intentar login de nuevo**

## Contacto de Soporte

Si el problema persiste:

1. Copia el output del script de debug
2. Copia los errores de la consola del navegador
3. Verifica el estado del usuario en Supabase
4. Comparte los logs para análisis

## Archivos Modificados

- ✅ `components/LoginForm.tsx` - Cambiado a `window.location.href`
- ✅ `lib/supabase/client.ts` - Implementado singleton
- ✅ `middleware.ts` - Ya configurado correctamente
- ✅ `lib/supabase/auth.ts` - Rutas de redirección actualizadas

## Próximos Pasos

Una vez que el login funcione:

1. Verificar que el dashboard de admin carga correctamente
2. Probar logout
3. Probar con otros roles (restaurant, client, delivery)
4. Verificar protección de rutas

---

**Última actualización:** 2025-11-15
**Estado:** Cambios aplicados, pendiente de prueba
