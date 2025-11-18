-- Script Final con el ID Correcto
-- Ejecuta este script en Supabase SQL Editor

-- Paso 1: Desactivar RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Paso 2: Insertar usuario admin con el ID CORRECTO de los logs
INSERT INTO users (id, email, name, phone, role, created_at, updated_at, email_confirm)
VALUES (
  '94fa1987-7543-423c-8f6c-851753936281',  -- ID CORRECTO de los logs
  'admin@donna.app',
  'Administrador',
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

-- Paso 3: Verificar
SELECT id, email, name, role, email_confirm
FROM users 
WHERE email = 'admin@donna.app';

-- Paso 4: También verificar por ID
SELECT id, email, name, role
FROM users
WHERE id = '94fa1987-7543-423c-8f6c-851753936281';
