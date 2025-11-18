-- SOLUCIÓN SIMPLE SIN TRIGGERS

-- 1. DESACTIVAR RLS TEMPORALMENTE
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. LIMPIAR TRIGGERS PROBLEMÁTICOS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. CREAR FUNCIÓN SEGURA PARA OBTENER PERFIL
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  phone text,
  email_confirm boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.phone,
    u.email_confirm,
    u.created_at
  FROM users u
  WHERE u.id = user_uuid;
END;
$$;

-- 4. INSERTAR USUARIO ADMIN MANUALMENTE
INSERT INTO users (id, email, name, role, phone, email_confirm, created_at, updated_at)
SELECT 
  au.id,
  'admin@donna.app',
  'Administrador',
  'admin',
  '1234567890',
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'admin@donna.app'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = 'Administrador',
  email_confirm = true,
  updated_at = NOW();

-- 5. VERIFICAR RESULTADO
SELECT 
  id, 
  email, 
  name, 
  role, 
  email_confirm
FROM users 
WHERE email = 'admin@donna.app';