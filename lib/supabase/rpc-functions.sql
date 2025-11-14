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

-- ===
=========================================================================
-- DELIVERY AGENT REGISTRATION FUNCTIONS
-- ============================================================================

-- Function to check phone availability
CREATE OR REPLACE FUNCTION check_phone_availability(p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return true if phone is available (not found), false if taken
  RETURN NOT EXISTS (
    SELECT 1 FROM public.users WHERE phone = p_phone
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_phone_availability(text) TO anon, authenticated;

-- Function to register delivery agent atomically (matching mobile app)
CREATE OR REPLACE FUNCTION register_delivery_agent_atomic(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_phone text,
  p_address text DEFAULT NULL,
  p_lat double precision DEFAULT NULL,
  p_lon double precision DEFAULT NULL,
  p_address_structured jsonb DEFAULT NULL,
  p_vehicle_type text DEFAULT 'motocicleta',
  p_vehicle_plate text DEFAULT NULL,
  p_vehicle_model text DEFAULT NULL,
  p_vehicle_color text DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL,
  p_place_id text DEFAULT NULL,
  p_profile_image_url text DEFAULT NULL,
  p_id_document_front_url text DEFAULT NULL,
  p_id_document_back_url text DEFAULT NULL,
  p_vehicle_photo_url text DEFAULT NULL,
  p_vehicle_registration_url text DEFAULT NULL,
  p_vehicle_insurance_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  -- 1. Validate user exists in auth.users
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- 2. Delete any auto-created client_profiles (prevents role conflicts)
  DELETE FROM public.client_profiles WHERE user_id = p_user_id;

  -- 3. Create or update user record with role='delivery_agent'
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    address,
    lat,
    lon,
    address_structured,
    role,
    email_confirm,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_email,
    p_name,
    p_phone,
    p_address,
    p_lat,
    p_lon,
    p_address_structured,
    'delivery_agent',
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    address_structured = EXCLUDED.address_structured,
    role = 'delivery_agent',
    updated_at = now();

  -- 4. Create delivery_agent_profile
  INSERT INTO public.delivery_agent_profiles (
    user_id,
    profile_image_url,
    id_document_front_url,
    id_document_back_url,
    vehicle_type,
    vehicle_plate,
    vehicle_model,
    vehicle_color,
    vehicle_registration_url,
    vehicle_insurance_url,
    vehicle_photo_url,
    emergency_contact_name,
    emergency_contact_phone,
    status,
    account_state,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_profile_image_url,
    p_id_document_front_url,
    p_id_document_back_url,
    p_vehicle_type,
    p_vehicle_plate,
    p_vehicle_model,
    p_vehicle_color,
    p_vehicle_registration_url,
    p_vehicle_insurance_url,
    p_vehicle_photo_url,
    p_emergency_contact_name,
    p_emergency_contact_phone,
    'pending',
    'pending',
    false,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    profile_image_url = EXCLUDED.profile_image_url,
    id_document_front_url = EXCLUDED.id_document_front_url,
    id_document_back_url = EXCLUDED.id_document_back_url,
    vehicle_type = EXCLUDED.vehicle_type,
    vehicle_plate = EXCLUDED.vehicle_plate,
    vehicle_model = EXCLUDED.vehicle_model,
    vehicle_color = EXCLUDED.vehicle_color,
    vehicle_registration_url = EXCLUDED.vehicle_registration_url,
    vehicle_insurance_url = EXCLUDED.vehicle_insurance_url,
    vehicle_photo_url = EXCLUDED.vehicle_photo_url,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    updated_at = now();

  -- 5. Create account for delivery agent
  INSERT INTO public.accounts (
    id,
    user_id,
    account_type,
    balance,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'delivery_agent',
    0.00,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    account_type = 'delivery_agent',
    updated_at = now()
  RETURNING id INTO v_account_id;

  -- 6. Create user preferences
  INSERT INTO public.user_preferences (
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'user_id', p_user_id,
      'delivery_agent_id', p_user_id,
      'account_id', v_account_id
    ),
    'error', null
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_delivery_agent_atomic TO anon, authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION register_delivery_agent_atomic IS 'Atomically registers a delivery agent with all required tables (users, delivery_agent_profiles, accounts, user_preferences)';
