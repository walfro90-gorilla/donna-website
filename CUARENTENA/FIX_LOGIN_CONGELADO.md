# 🔧 Fix: Login Congelado

## 🐛 Problema

El login se queda en "Iniciando sesión..." y no redirige a ningún lado.

## ✅ Soluciones Aplicadas

### 1. **Logs de Debug Agregados**

Ahora el sistema muestra logs detallados en la consola:

```javascript
🔐 Iniciando login...
🔑 signInWithEmail: Iniciando autenticación...
🔑 signInWithEmail: Respuesta de Supabase: { data: true, error: false }
🔑 signInWithEmail: Obteniendo rol del usuario...
🔑 signInWithEmail: Rol obtenido: admin
🔑 signInWithEmail: Rol mapeado: admin
📊 Resultado del login: { success: true, role: 'admin', user: {...} }
✅ Login exitoso, rol: admin
✅ Login exitoso, redirigiendo a: /admin
```

### 2. **Redirección Mejorada con Fallback**

```typescript
// Intenta window.location.href primero
try {
  window.location.href = redirectPath;
} catch (e) {
  // Fallback a router.push si falla
  router.push(redirectPath);
  router.refresh();
}
```

### 3. **Manejo de Errores Mejorado**

- ✅ Logs en cada paso del proceso
- ✅ Mensajes de error claros
- ✅ Fallback automático si algo falla

## 🧪 Cómo Debuggear

### 1. Abre la Consola del Navegador

Presiona `F12` y ve a la pestaña **Console**

### 2. Intenta Hacer Login

Ingresa tus credenciales y haz clic en "Iniciar Sesión"

### 3. Observa los Logs

Deberías ver una secuencia como esta:

#### ✅ Login Exitoso:
```
🔐 Iniciando login...
🔑 signInWithEmail: Iniciando autenticación...
🔑 signInWithEmail: Respuesta de Supabase: { data: true, error: false }
🔑 signInWithEmail: Obteniendo rol del usuario...
🔑 signInWithEmail: Rol obtenido: admin
🔑 signInWithEmail: Rol mapeado: admin
📊 Resultado del login: { success: true, role: 'admin', ... }
✅ Login exitoso, rol: admin
✅ Login exitoso, redirigiendo a: /admin
```

#### ❌ Login Fallido (Credenciales Incorrectas):
```
🔐 Iniciando login...
🔑 signInWithEmail: Iniciando autenticación...
🔑 signInWithEmail: Error de autenticación: Invalid login credentials
❌ Login fallido: Email o contraseña incorrectos
```

#### ❌ Usuario Sin Rol:
```
🔐 Iniciando login...
🔑 signInWithEmail: Iniciando autenticación...
🔑 signInWithEmail: Respuesta de Supabase: { data: true, error: false }
🔑 signInWithEmail: Obteniendo rol del usuario...
🔑 signInWithEmail: Rol obtenido: null
🔑 signInWithEmail: Usuario sin rol
❌ Login fallido: No se pudo obtener el rol del usuario
```

## 🔍 Diagnóstico de Problemas

### Problema 1: Se Queda en "Iniciando sesión..."

**Síntomas:**
- Botón muestra "Iniciando sesión..."
- No hay redirección
- No aparece mensaje de error

**Posibles Causas:**

#### A) Usuario no existe en tabla `users`

**Logs que verás:**
```
🔑 signInWithEmail: Rol obtenido: null
🔑 signInWithEmail: Usuario sin rol
```

**Solución:**
```sql
-- Verifica si el usuario existe
SELECT * FROM users WHERE email = 'admin@donna.app';

-- Si no existe, créalo
INSERT INTO users (id, email, full_name, role, phone, created_at)
VALUES (
  'USER_ID_FROM_AUTH',  -- Obtén esto de Authentication → Users
  'admin@donna.app',
  'Admin User',
  'admin',
  '1234567890',
  NOW()
);
```

#### B) Rol es NULL o inválido

**Logs que verás:**
```
🔑 signInWithEmail: Rol obtenido: null
```

**Solución:**
```sql
-- Actualiza el rol
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@donna.app';
```

#### C) window.location.href no funciona

**Logs que verás:**
```
✅ Login exitoso, redirigiendo a: /admin
Usando router.push como fallback
```

**Solución:**
- Esto es normal, el fallback debería funcionar
- Si no redirige, verifica que el dashboard existe en `/admin`

### Problema 2: Error de Conexión

**Síntomas:**
- Mensaje: "Error de conexión. Por favor, verifica tu internet"

**Logs que verás:**
```
🔑 signInWithEmail: Error de autenticación: fetch failed
```

**Solución:**
1. Verifica tu conexión a internet
2. Verifica que Supabase esté funcionando
3. Verifica las variables de entorno:
   ```bash
   npm run verify:env
   ```

### Problema 3: Credenciales Incorrectas

**Síntomas:**
- Mensaje: "Email o contraseña incorrectos"

**Logs que verás:**
```
🔑 signInWithEmail: Error de autenticación: Invalid login credentials
```

**Solución:**
1. Verifica que el email sea correcto
2. Verifica que la contraseña sea correcta
3. Verifica que el usuario exista en Supabase Auth

## 🚀 Pasos para Resolver

### 1. Verifica el Usuario en Supabase

#### A) Authentication → Users
1. Ve a Supabase Dashboard
2. Authentication → Users
3. Busca tu usuario (admin@donna.app)
4. Copia el **User ID**

#### B) Table Editor → users
1. Ve a Table Editor
2. Selecciona tabla `users`
3. Busca el registro con el User ID del paso anterior
4. Verifica que:
   - `id` = User ID de Auth
   - `email` = admin@donna.app
   - `role` = 'admin' (exactamente, minúsculas)
   - `full_name` = Cualquier nombre

### 2. Si el Usuario No Existe en `users`

```sql
-- Reemplaza USER_ID_FROM_AUTH con el ID real
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

### 3. Si el Rol es NULL o Incorrecto

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@donna.app';
```

### 4. Reinicia el Servidor

```bash
# Ctrl+C para detener
npm run dev
```

### 5. Limpia el Navegador

1. Abre DevTools (F12)
2. Application → Storage → Clear site data
3. O usa modo incógnito

### 6. Intenta Login de Nuevo

1. Ve a `/login`
2. Ingresa credenciales
3. Observa la consola
4. Deberías ver los logs y la redirección

## 📊 Checklist de Verificación

- [ ] Usuario existe en Supabase Auth
- [ ] Usuario existe en tabla `users`
- [ ] Campo `id` en `users` coincide con User ID de Auth
- [ ] Campo `role` es exactamente 'admin' (minúsculas)
- [ ] Variables de entorno configuradas (`npm run verify:env`)
- [ ] Servidor reiniciado
- [ ] Navegador limpio (caché/cookies)
- [ ] Consola del navegador abierta para ver logs

## 🎯 Resultado Esperado

Después de aplicar estos fixes:

1. ✅ Login muestra logs detallados en consola
2. ✅ Si hay error, se muestra mensaje claro
3. ✅ Si es exitoso, redirige al dashboard
4. ✅ Si falla la redirección, usa fallback automático

## 📞 Si Aún No Funciona

Comparte:
1. **Captura de pantalla** de la consola del navegador
2. **Todos los logs** que aparecen
3. **Captura de pantalla** del registro en Supabase (tabla users)
4. **Resultado** de `npm run verify:env`

---

**Última actualización:** 2025-11-15
**Estado:** Logs agregados, listo para debugging
