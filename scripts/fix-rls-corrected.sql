-- Solución Corregida según el esquema real de la base de datos
-- Ejecuta este script en Supabase SQL Editor

-- Paso 1: Desactivar RLS en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Paso 2: Verificar que el usuario existe en auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@donna.app';

-- Paso 3: Insertar/Actualizar usuario en tabla users
-- Usando las columnas correctas: id, email, name, phone, role
INSERT INTO users (id, email, name, phone, role, created_at, updated_at, email_confirm)
VALUES (
  '94fa1987-7543-423c-bf6c-8517a993bd81',  -- ID del log
  'admin@donna.app',
  'Administrador',  -- Columna 'name', no 'full_name'
  '1234567890',
  'admin',
  NOW(),
  NOW(),
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  name = 'Administrador',
  email_confirm = true,
  updated_at = NOW();

-- Paso 4: Verificar que se creó correctamente
SELECT id, email, name, role, email_confirm
FROM users 
WHERE email = 'admin@donna.app';

-- Paso 5: Verificar que RLS está desactivado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
