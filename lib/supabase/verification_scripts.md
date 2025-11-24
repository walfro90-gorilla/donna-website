# Scripts de Verificación y Mejora para Supabase (V2)

> [!IMPORTANT]
> Se ha detectado un error de "teléfono duplicado". Usa el **Script de Corrección V2** a continuación.

## 1. Script de Corrección V2 (Fix Phone Duplicate Error)

Este script hace dos cosas:
1.  🧹 **Limpia usuarios huérfanos**: Borra usuarios de `public.users` que no existen en `auth.users` (que suelen causar estos conflictos).
2.  🛠️ **Actualiza la RPC**: Mejora `register_restaurant_atomic` para manejar errores de teléfono duplicado elegantemente.

Ejecuta esto en el **SQL Editor** de Supabase:

```sql
-- FIX V2: Handle phone duplication and cleanup orphans

-- 1. Cleanup orphan users (users in public.users but not in auth.users)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.users WHERE id NOT IN (SELECT id FROM auth.users) LOOP
    -- Delete related records first to avoid FK violations
    DELETE FROM public.user_preferences WHERE user_id = r.id;
    DELETE FROM public.accounts WHERE user_id = r.id;
    DELETE FROM public.restaurants WHERE user_id = r.id;
    DELETE FROM public.delivery_agent_profiles WHERE user_id = r.id;
    DELETE FROM public.client_profiles WHERE user_id = r.id;
    
    -- Delete the user
    DELETE FROM public.users WHERE id = r.id;
    RAISE NOTICE 'Deleted orphan user: %', r.id;
  END LOOP;
END $$;

-- 2. Update RPC to gracefully handle phone duplication
DROP FUNCTION IF EXISTS public.register_restaurant_atomic(uuid, text, text, text, double precision, double precision, text, jsonb);
DROP FUNCTION IF EXISTS public.register_restaurant_atomic(uuid, text, text, text, text, text, double precision, double precision, text, jsonb);

CREATE OR REPLACE FUNCTION public.register_restaurant_atomic(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_restaurant_name text,
  p_phone text,
  p_address text,
  p_location_lat double precision,
  p_location_lon double precision,
  p_location_place_id text DEFAULT NULL,
  p_address_structured jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id uuid;
  v_account_id uuid;
BEGIN
  -- 1. Check if phone is already taken by ANOTHER user
  IF EXISTS (SELECT 1 FROM public.users WHERE phone = p_phone AND id != p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El número de teléfono ya está registrado por otro usuario.'
    );
  END IF;

  -- 2. Create/Update public.users (MUST BE FIRST)
  INSERT INTO public.users (
    id, email, name, phone, role, created_at, updated_at
  )
  VALUES (
    p_user_id, p_email, p_name, p_phone, 'restaurant', now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = 'restaurant',
    updated_at = now();

  -- 3. Create restaurant record (MUST BE SECOND)
  INSERT INTO public.restaurants (
    user_id, name, phone, address, location_lat, location_lon, 
    location_place_id, address_structured, status, online, created_at, updated_at
  ) VALUES (
    p_user_id, p_restaurant_name, p_phone, p_address, p_location_lat, p_location_lon,
    p_location_place_id, p_address_structured, 'pending', false, now(), now()
  )
  RETURNING id INTO v_restaurant_id;

  -- 4. Create financial account
  INSERT INTO public.accounts (
    user_id, account_type, balance, created_at, updated_at
  )
  VALUES (
    p_user_id, 'restaurant', 0.00, now(), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    account_type = EXCLUDED.account_type,
    updated_at = now()
  RETURNING id INTO v_account_id;

  -- 5. Create user preferences
  INSERT INTO public.user_preferences (user_id, created_at, updated_at)
  VALUES (p_user_id, now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'restaurant_id', v_restaurant_id,
    'account_id', v_account_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Catch unique constraint violations explicitly
  IF SQLERRM LIKE '%idx_users_phone_unique_not_null%' THEN
     RETURN jsonb_build_object('success', false, 'error', 'El número de teléfono ya está registrado.');
  END IF;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_restaurant_atomic(uuid, text, text, text, text, text, double precision, double precision, text, jsonb) TO anon, authenticated;
```

## 2. Script de Limpieza (Si el error persiste)

Si sigues teniendo problemas con un email específico, usa este script para borrarlo completamente antes de reintentar.

```sql
-- Reemplaza con el email del usuario a borrar
DO $$
DECLARE
  v_email text := 'TU_EMAIL_AQUI';
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuario no encontrado, nada que borrar.';
    RETURN;
  END IF;

  -- Borrar en orden inverso a la creación (por las Foreign Keys)
  DELETE FROM public.user_preferences WHERE user_id = v_user_id;
  DELETE FROM public.accounts WHERE user_id = v_user_id;
  DELETE FROM public.restaurants WHERE user_id = v_user_id;
  DELETE FROM public.users WHERE id = v_user_id;
  
  -- Finalmente borrar de auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Usuario y datos relacionados eliminados correctamente.';
END $$;
```
