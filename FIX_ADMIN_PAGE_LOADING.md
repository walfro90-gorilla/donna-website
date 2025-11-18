# 🔧 Solución: Página de Admin se Queda Cargando

## 🎯 Problema
El login redirige correctamente a `/admin` pero la página se queda en "Cargando..." indefinidamente.

## 🔍 Causa
El usuario se autentica correctamente en Supabase Auth, pero **no existe en la tabla `users`** de la base de datos. La página de admin intenta consultar esta tabla y falla.

## ✅ Solución

### Paso 1: Obtener el User ID de los Logs

1. **Abre la consola del navegador** (F12 → Console)
2. **Intenta hacer login** con `admin@donna.app`
3. **Busca en los logs** el mensaje que dice:
   ```
   🔐 Admin page: Session check result: {hasSession: true, userId: "abc123-def456..."}
   ```
4. **Copia el `userId`** completo (es un UUID como `abc123-def456-ghi789-012345`)

### Paso 2: Crear el Usuario en la Base de Datos

1. **Abre Supabase Dashboard** → SQL Editor
2. **Ejecuta este SQL** (reemplaza `TU_USER_ID_AQUI` con el UUID que copiaste):

```sql
INSERT INTO users (id, email, full_name, role, phone, created_at, updated_at)
VALUES (
  'TU_USER_ID_AQUI',  -- ⚠️ REEMPLAZA CON EL UUID DE LOS LOGS
  'admin@donna.app',
  'Administrador',
  'admin',
  '1234567890',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  updated_at = NOW();
```

3. **Verifica que se creó correctamente**:
```sql
SELECT * FROM users WHERE email = 'admin@donna.app';
```

### Paso 3: Recargar la Página

1. **Vuelve al navegador** (localhost:3000/admin)
2. **Recarga la página** (F5 o Ctrl+R)
3. **Deberías ver el dashboard de admin** funcionando correctamente

## 📊 Logs Esperados (Exitosos)

Cuando funcione correctamente, verás estos logs en la consola:

```
🔐 Admin page: Checking authentication...
🔐 Admin page: Session check result: {hasSession: true, userId: "abc123..."}
👤 Admin page: Fetching user data from database...
👤 Admin page: User data result: {hasData: true, hasError: false}
👤 Admin page: User role: admin
✅ Admin page: Authentication successful
```

## 🔍 Si Sigue Sin Funcionar

### Verifica la Estructura de la Tabla

Asegúrate de que la tabla `users` existe y tiene esta estructura:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'restaurant', 'client', 'delivery_agent')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Verifica los Permisos RLS

Si tienes Row Level Security (RLS) habilitado, necesitas una política que permita leer:

```sql
-- Permitir que los usuarios lean su propia información
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);
```

## 📁 Archivos Modificados

```
✅ app/admin/page.tsx              # Mejor manejo de errores y logs detallados
✅ scripts/create-admin-user.sql   # Script SQL para crear usuario admin
✅ FIX_ADMIN_PAGE_LOADING.md       # Este documento
```

## 🎉 Resultado Esperado

Una vez completados los pasos, deberías ver:

- ✅ Login exitoso con redirección a `/admin`
- ✅ Dashboard de admin cargando correctamente
- ✅ Información del usuario mostrada
- ✅ Botón de "Cerrar Sesión" funcionando

---

**💡 Tip**: Guarda el UUID del usuario admin para futuras referencias. Lo necesitarás si tienes que recrear la base de datos.
