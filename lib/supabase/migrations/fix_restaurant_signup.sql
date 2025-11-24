-- Migration: Fix register_restaurant_atomic RPC
-- Description: Updates the function to accept email/name directly and fixes insert order (users -> restaurants)
-- Date: 2025-11-23

-- Drop the old function first to avoid signature conflicts if we change arguments
DROP FUNCTION IF EXISTS public.register_restaurant_atomic(uuid, text, text, text, double precision, double precision, text, jsonb);

-- Create the updated function
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
  -- 1. Validate user exists in auth.users (optional, but good for sanity)
  -- We won't SELECT from it to avoid permissions, just rely on FK if we wanted, 
  -- but public.users.id -> auth.users.id is a manual FK usually.
  -- Let's just proceed. If p_user_id doesn't exist in auth.users, 
  -- the insert into public.users MIGHT fail if there is a strict FK constraint 
  -- defined in the schema (CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)).
  -- The schema showed: CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
  -- So we are safe to just insert.

  -- 2. Create/Update public.users (MUST BE FIRST)
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    role,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_email,
    p_name,
    p_phone,
    'restaurant',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = 'restaurant',
    updated_at = now();

  -- 3. Create restaurant record (MUST BE SECOND)
  INSERT INTO public.restaurants (
    user_id,
    name,
    phone,
    address,
    location_lat,
    location_lon,
    location_place_id,
    address_structured,
    status,
    online,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_restaurant_name, -- Wait, I missed p_restaurant_name in the arguments list above!
    p_phone,
    p_address,
    p_location_lat,
    p_location_lon,
    p_location_place_id,
    p_address_structured,
    'pending',
    false,
    now(),
    now()
  )
  RETURNING id INTO v_restaurant_id;

  -- 4. Create financial account
  INSERT INTO public.accounts (
    user_id,
    account_type,
    balance,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    'restaurant',
    0.00,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    account_type = EXCLUDED.account_type,
    updated_at = now()
  RETURNING id INTO v_account_id;

  -- 5. Create user preferences
  INSERT INTO public.user_preferences (user_id, created_at, updated_at)
  VALUES (p_user_id, now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  -- 6. Return success
  RETURN jsonb_build_object(
    'success', true,
    'restaurant_id', v_restaurant_id,
    'account_id', v_account_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.register_restaurant_atomic(uuid, text, text, text, text, text, double precision, double precision, text, jsonb) TO anon, authenticated;
