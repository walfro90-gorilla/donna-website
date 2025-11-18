-- Script para crear usuario admin en la base de datos
-- Ejecuta este script en el SQL Editor de Supabase

-- Primero, verifica si el usuario ya existe en auth.users
-- Reemplaza 'TU_USER_ID_AQUI' con el ID que aparece en los logs del navegador

-- Opción 1: Si ya tienes el user_id de los logs
INSERT INTO users (id, email, full_name, role, phone, created_at, updated_at)
VALUES (
  'TU_USER_ID_AQUI',  -- Reemplaza con el UUID de los logs (ejemplo: 'abc123-def456-ghi789')
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

-- Opción 2: Si no tienes el user_id, primero consúltalo
-- SELECT id, email FROM auth.users WHERE email = 'admin@donna.app';
-- Luego usa ese ID en la consulta de arriba

-- Verificar que el usuario se creó correctamente
SELECT * FROM users WHERE email = 'admin@donna.app';
