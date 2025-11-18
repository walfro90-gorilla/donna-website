# 🚀 Solución Inmediata - Login con Supabase

## 🎯 Problema Identificado

Los logs muestran:
```
✅ Autenticación exitosa
✅ User ID obtenido: 94fa1987-7543-423c-bf6c-8517a993bd81
❌ getUserRole: Database query timeout
❌ Usuario sin rol en la base de datos
```

**Causa**: Las políticas RLS están bloqueando el acceso a la tabla `users`.

## ✅ Solución en 2 Pasos

### Paso 1: Ejecutar Script SQL

Abre **Supabase Dashboard** → **SQL Editor** y ejecuta:

```sql
-- Desactivar RLS temporalmente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insertar usuario admin con el ID correcto
INSERT INTO users (id, email, full_name, role, phone, created_at, updated_at)
VALUES (
  '94fa1987-7543-423c-bf6c-8517a993bd81',
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
  full_name = 'Administrador',
  updated_at = NOW();

-- Verificar
SELECT id, email, full_name, role 
FROM users 
WHERE email = 'admin@donna.app';
```

### Paso 2: Probar Login

1. Ve a `http://localhost:3000/login`
2. Ingresa:
   - Email: `admin@donna.app`
   - Password: (tu password de Supabase)
3. Click en "Iniciar Sesión"

## 📊 Logs Esperados (Exitosos)

Deberías ver:
```
🔑 signInWithEmail: Iniciando autenticación...
🔑 signInWithEmail: Respuesta recibida
👤 getUserRole: Consultando rol para user ID: 94fa1987-7543-423c-bf6c-8517a993bd81
👤 getUserRole: Ejecutando query...
👤 getUserRole: Query completado
👤 getUserRole: Rol encontrado: admin
✅ Login exitoso, rol: admin
```

Y redirigirá a `/admin` correctamente.

## 🔍 Si Sigue Fallando

He mejorado los logs de `getUserRole` para mostrar más detalles del error. Si falla, comparte:

1. El mensaje de error completo
2. El error code
3. El error details
4. El error hint

Esto me dirá exactamente qué está bloqueando el acceso.

## ⚠️ Nota sobre RLS

Desactivar RLS es **solo para development**. Antes de producción deberás:

1. Reactivar RLS:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

2. Crear políticas correctas:
```sql
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

## 📁 Archivos Modificados

```
✅ lib/supabase/auth.ts           # Logs mejorados en getUserRole
✅ scripts/fix-rls-simple.sql     # Script SQL simplificado
✅ SOLUCION_INMEDIATA.md          # Este documento
```

## 🎉 Resultado Final

Una vez ejecutado el script SQL:

- ✅ Login con `admin@donna.app` funcionará
- ✅ Obtendrá el rol correctamente
- ✅ Redirigirá a `/admin`
- ✅ El bypass con `admin@test.com` seguirá funcionando

---

**Ejecuta el script SQL y prueba el login. Comparte los logs si hay algún problema.**

