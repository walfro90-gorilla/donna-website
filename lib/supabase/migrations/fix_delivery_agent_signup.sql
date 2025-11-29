-- Migration to fix register_delivery_agent_atomic function
-- This function ensures all necessary records are created atomically for a new delivery agent.

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

  -- 2. Delete any auto-created client_profiles (prevents role conflicts if any)
  DELETE FROM public.client_profiles WHERE user_id = p_user_id;

  -- 3. Create or update user record with role='delivery_agent'
  -- We use ON CONFLICT to ensure we don't fail if the record already exists (e.g. retry)
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    address,
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
    'delivery_agent',
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
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
    user_id,
    account_type,
    balance,
    created_at,
    updated_at
  )
  VALUES (
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
    -- Log error if needed, or just return it
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_delivery_agent_atomic TO anon, authenticated, service_role;

COMMENT ON FUNCTION register_delivery_agent_atomic IS 'Atomically registers a delivery agent with all required tables (users, delivery_agent_profiles, accounts, user_preferences). Fixed version.';
