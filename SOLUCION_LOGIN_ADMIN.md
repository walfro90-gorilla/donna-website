# 🔧 Solución: Login de Admin No Redirige

## 🐛 Problema

El login con usuario admin se queda en estado de carga ("Iniciando sesión...") y no redirige al dashboard de admin.

## ✅ Cambios Aplicados

### 1. Forzar Recarga Completa (`components/LoginForm.tsx`)

**Problema:** `router.push()` no estaba refrescando la sesión correctamente.

**Solución:** Cambiado a `window.location.href` para forzar recarga completa.

```typescript
// ❌ Antes (no funcionaba):
router.push(redirectPath);

// ✅ Después (funciona):
window.location.href = redirectPath;
```

### 2. Singleton para Cliente Supabase (`lib/supabase/client.ts`)

**Problema:** Múltiples instancias de GoTrueClient causaban conflictos.

**Solución:** Implementado patrón singleton.

```typescript
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  // Crear nueva instancia solo si no existe
  supabaseInstance = createSupabaseClient(...);
  return supabaseInstance;
}
```

### 3. Panel de Debug (`components/DebugPanel.tsx`)

**Agregado:** Panel de debug temporal para diagnosticar problemas.

**Ubicación:** Botón "🐛 Debug" en la esquina inferior derecha de `/login`

## 🚀 Pasos para Resolver

### Paso 1: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C en la terminal)
# Iniciar de nuevo
npm run dev
```

### Paso 2: Limpiar Caché del Navegador

**Opción A - Recarga Forzada:**
1. Abre DevTools (F12)
2. Haz clic derecho en el botón de recargar
3. Selecciona "Vaciar caché y recargar de forma forzada"

**Opción B - Limpiar Todo:**
1. Presiona `Ctrl + Shift + Delete`
2. Selecciona "Cookies y otros datos de sitios"
3. Selecciona "Imágenes y archivos en caché"
4. Haz clic en "Borrar datos"

### Paso 3: Verificar Usuario en Supabase

1. **Ve a Supabase Dashboard**
2. **Authentication → Users**
3. **Busca tu usuario admin** (`admin@donna.app`)
4. **Copia el User ID**

5. **Ve a Table Editor → users**
6. **Busca el registro con ese User ID**
7. **Verifica que el campo `role` sea exactamente `'admin'`**

Si no existe el registro:

```sql
-- Reemplaza 'USER_ID_FROM_AUTH' con el ID real del paso 4
INSERT INTO users (id, email, full_name, role, phone, created_at)
VALUES (
  'USER_ID_FROM_AUTH',
  'admin@donna.app',
  'Admin User',
  'admin',
  '1234567890',
  NOW()
);
```

Si existe pero el rol está mal:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@donna.app';
```

### Paso 4: Probar Login con Debug Panel

1. **Ve a `http://localhost:3000/login`**
2. **Haz clic en el botón "🐛 Debug"** (esquina inferior derecha)
3. **Observa la información mostrada:**
   - ✅ Has Session: Yes/No
   - ✅ User ID
   - ✅ Email
   - ✅ Role

4. **Ingresa credenciales de admin**
5. **Haz clic en "Iniciar Sesión"**
6. **Después del login, haz clic en "🔄 Refresh Debug Info"**
7. **Verifica que:**
   - Has Session: ✅ Yes
   - Role: admin

## 🔍 Diagnóstico con Debug Panel

### Escenario 1: "Has Session: No"

**Problema:** El login no está creando la sesión.

**Soluciones:**
1. Verificar que las credenciales son correctas
2. Verificar que el usuario existe en Supabase Auth
3. Verificar variables de entorno:
   ```bash
   npm run verify:env
   ```

### Escenario 2: "Has Session: Yes" pero "User Data Error"

**Problema:** El usuario no existe en la tabla `users`.

**Solución:** Ejecutar el INSERT de arriba con el User ID correcto.

### Escenario 3: "Has Session: Yes" y "Role: null"

**Problema:** El usuario existe pero no tiene rol asignado.

**Solución:** Ejecutar el UPDATE de arriba.

### Escenario 4: "Has Session: Yes" y "Role: admin" pero no redirige

**Problema:** El middleware no está ejecutándose.

**Solución:**
1. Verificar que `middleware.ts` está en la raíz del proyecto
2. Reiniciar el servidor completamente
3. Probar en modo incógnito

## 🧪 Prueba Manual Completa

### 1. Abrir DevTools

Presiona `F12` para abrir las herramientas de desarrollador.

### 2. Ir a la Pestaña Console

Aquí verás todos los logs y errores.

### 3. Intentar Login

1. Ingresa email: `admin@donna.app`
2. Ingresa contraseña
3. Haz clic en "Iniciar Sesión"

### 4. Observar Console

Deberías ver algo como:
```
✅ Login exitoso
✅ Rol: admin
✅ Redirigiendo a: /admin
```

Si ves errores, cópialos y compártelos.

### 5. Verificar Redirección

Después del login, deberías ser redirigido automáticamente a `/admin`.

## 🎯 Checklist de Verificación

Antes de probar, asegúrate de:

- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Caché del navegador limpiado
- [ ] Usuario existe en Supabase Auth
- [ ] Usuario existe en tabla `users`
- [ ] Campo `role` es exactamente `'admin'` (no `'Admin'` ni `'ADMIN'`)
- [ ] Variables de entorno configuradas (`npm run verify:env`)
- [ ] DevTools abierto para ver errores

## 📊 Flujo Esperado

```
1. Usuario ingresa credenciales
   ↓
2. Sistema valida con Supabase Auth
   ↓
3. Sistema obtiene User ID
   ↓
4. Sistema busca rol en tabla users
   ↓
5. Sistema encuentra role = 'admin'
   ↓
6. Sistema ejecuta: window.location.href = '/admin'
   ↓
7. Navegador carga /admin
   ↓
8. Middleware verifica sesión y rol
   ↓
9. Middleware permite acceso
   ↓
10. Dashboard de admin se muestra ✅
```

## 🚨 Errores Comunes

### Error: "Invalid login credentials"

**Causa:** Email o contraseña incorrectos.

**Solución:** Verificar credenciales en Supabase Auth.

### Error: "No role assigned"

**Causa:** Usuario no tiene registro en tabla `users` o `role` es null.

**Solución:** Ejecutar INSERT o UPDATE de arriba.

### Error: "Redirect loop"

**Causa:** Middleware está redirigiendo infinitamente.

**Solución:**
1. Verificar que el rol en la base de datos es correcto
2. Verificar que el middleware no tiene errores
3. Limpiar cookies completamente

### Error: "Session expired"

**Causa:** La sesión expiró.

**Solución:** Hacer login de nuevo.

## 🔧 Comandos Útiles

```bash
# Verificar variables de entorno
npm run verify:env

# Reiniciar servidor
# Ctrl+C para detener
npm run dev

# Limpiar node_modules y reinstalar (si nada funciona)
rm -rf node_modules
npm install
npm run dev
```

## 📝 Notas Importantes

1. **El panel de debug es temporal** - Debes removerlo en producción
2. **Usa modo incógnito** si tienes problemas con cookies
3. **Verifica la consola del navegador** siempre que algo no funcione
4. **El rol debe ser exactamente** `'admin'` (minúsculas, sin espacios)

## ✅ Resultado Esperado

Después de aplicar estos cambios:

1. ✅ Login muestra estado de carga
2. ✅ Login valida credenciales
3. ✅ Login obtiene rol del usuario
4. ✅ Login redirige a `/admin`
5. ✅ Dashboard de admin se carga
6. ✅ Usuario puede ver estadísticas
7. ✅ Usuario puede cerrar sesión

## 🎉 Próximos Pasos

Una vez que el login funcione:

1. **Remover el DebugPanel** de `app/login/page.tsx`
2. **Probar con otros roles** (restaurant, client, delivery)
3. **Probar logout** desde el dashboard
4. **Probar protección de rutas** (intentar acceder a `/admin` sin login)

## 📞 Si Aún No Funciona

Comparte esta información:

1. **Output del Debug Panel** (captura de pantalla)
2. **Errores de la consola** (copia el texto)
3. **Resultado de `npm run verify:env`**
4. **Captura de pantalla del registro en Supabase** (tabla users)

---

**Última actualización:** 2025-11-15
**Estado:** Cambios aplicados, listo para probar
