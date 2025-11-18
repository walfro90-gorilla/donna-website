-- Solución Simple: Desactivar RLS temporalmente
-- Ejecuta este script en Supabase SQL Editor

-- Paso 1: Desactivar RLS en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Paso 2: Verificar que el usuario existe en auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@donna.app';

-- Paso 3: Insertar/Actualizar usuario en tabla users
-- IMPORTANTE: Reemplaza 'USER_ID_AQUI' con el ID que aparece en los logs
-- En tu caso es: 94fa1987-7543-423c-bf6c-8517a993bd81

INSERT INTO users (id, email, full_name, role, phone, created_at, updated_at)
VALUES (
  '94fa1987-7543-423c-bf6c-8517a993bd81',  -- ID del log
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

-- Paso 4: Verificar que se creó correctamente
SELECT id, email, full_name, role 
FROM users 
WHERE email = 'admin@donna.app';
