-- SISTEMA DE AUTENTICACIÓN COMPLETO PARA DOÑA REPARTOS

-- PASO 1: LIMPIAR CONFIGURACIÓN ANTERIOR
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "authenticated_users_select_own" ON users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON users;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_user_profile(uuid);

-- PASO 2: CREAR FUNCIÓN PARA OBTENER PERFIL
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

-- PASO 3: CONFIGURAR RLS Y POLÍTICAS
CREATE POLICY "authenticated_users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "authenticated_users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;-- PASO 4: I
NSERTAR USUARIO ADMIN
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@donna.app';
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, role, phone, email_confirm, created_at, updated_at)
    VALUES (
      admin_user_id,
      'admin@donna.app',
      'Administrador',
      'admin',
      '1234567890',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      name = 'Administrador',
      email_confirm = true,
      updated_at = NOW();
    
    RAISE NOTICE 'Usuario admin configurado con ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Usuario admin@donna.app no encontrado en auth.users';
  END IF;
END $$;

-- PASO 5: VERIFICACIONES
SELECT 
  'RLS Status' as check_type,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users'

UNION ALL

SELECT 
  'Admin User' as check_type,
  CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM users 
WHERE email = 'admin@donna.app' AND role = 'admin'

UNION ALL

SELECT 
  'Policies Count' as check_type,
  COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'users';