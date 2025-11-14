-- RPC Functions for validation
-- These should be created in your Supabase database

-- Function to check email availability
CREATE OR REPLACE FUNCTION check_email_availability(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return true if email is available (not found), false if taken
  RETURN NOT EXISTS (
    SELECT 1 FROM users WHERE email = p_email
  );
END;
$$;

-- Function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile_v2(
  p_user_id uuid,
  p_email text,
  p_phone text,
  p_first_name text,
  p_last_name text,
  p_user_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user record
  INSERT INTO users (id, email, name, phone, role, created_at, updated_at)
  VALUES (
    p_user_id,
    p_email,
    CONCAT(p_first_name, ' ', p_last_name),
    p_phone,
    p_user_type,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = now();
END;
$$;

-- Function to check restaurant name availability
CREATE OR REPLACE FUNCTION check_restaurant_name_availability(p_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return true if name is available (not found), false if taken
  RETURN NOT EXISTS (
    SELECT 1 FROM restaurants WHERE LOWER(name) = LOWER(p_name)
  );
END;
$$;

-- Function to register restaurant atomically (matching mobile app)
CREATE OR REPLACE FUNCTION register_restaurant_atomic(
  p_user_id uuid,
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
  -- 1. Validate user exists
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- 2. Create restaurant record
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
    p_restaurant_name,
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

  -- 3. Create/update user profile
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    role,
    created_at,
    updated_at
  )
  SELECT 
    p_user_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', ''),
    p_phone,
    'restaurant',
    now(),
    now()
  FROM auth.users au WHERE au.id = p_user_id
  ON CONFLICT (id) DO UPDATE SET
    role = 'restaurant',
    phone = EXCLUDED.phone,
    updated_at = now();

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
GRANT EXECUTE ON FUNCTION public.check_restaurant_name_availability(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_restaurant_atomic(uuid, text, text, text, double precision, double precision, text, jsonb) TO anon, authenticated;

-- Function to register delivery agent
CREATE OR REPLACE FUNCTION register_delivery_agent_v2(
  p_user_id uuid,
  p_email text,
  p_phone text,
  p_first_name text,
  p_last_name text,
  p_city text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user profile exists first
  PERFORM ensure_user_profile_v2(
    p_user_id,
    p_email,
    p_phone,
    p_first_name,
    p_last_name,
    'delivery_agent'
  );

  -- Create delivery agent profile
  INSERT INTO delivery_agent_profiles (
    user_id,
    status,
    account_state,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    'pending',
    'pending',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    account_state = EXCLUDED.account_state,
    updated_at = now();

  -- Create account for the delivery agent
  INSERT INTO accounts (user_id, account_type, balance, created_at, updated_at)
  VALUES (p_user_id, 'delivery_agent', 0.00, now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create admin notification
  INSERT INTO admin_notifications (
    target_role,
    category,
    entity_type,
    entity_id,
    title,
    message,
    metadata
  )
  VALUES (
    'admin',
    'registration',
    'delivery_agent',
    p_user_id,
    'Nuevo registro de repartidor',
    CONCAT('Se ha registrado un nuevo repartidor: ', p_first_name, ' ', p_last_name),
    jsonb_build_object(
      'user_id', p_user_id,
      'email', p_email,
      'phone', p_phone,
      'city', p_city
    )
  );
END;
$$;