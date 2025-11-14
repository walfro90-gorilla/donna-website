-- Enhanced User Registration RPC Functions
-- These functions provide comprehensive multi-step registration support with progress tracking

-- ============================================================================
-- USER PROFILE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create or update user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
  user_email TEXT,
  user_role user_role,
  user_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  profile_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  role user_role,
  name TEXT,
  phone TEXT,
  registration_status registration_status,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  is_new_user BOOLEAN := false;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  user_id := auth.uid();

  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = user_id) THEN
    is_new_user := true;
    
    -- Insert new user profile
    INSERT INTO user_profiles (
      id,
      email,
      role,
      name,
      phone,
      registration_status,
      registration_step,
      metadata
    ) VALUES (
      user_id,
      user_email,
      user_role,
      user_name,
      user_phone,
      'draft',
      1,
      profile_metadata
    );
  ELSE
    -- Update existing profile
    UPDATE user_profiles 
    SET 
      email = COALESCE(user_email, user_profiles.email),
      role = COALESCE(user_role, user_profiles.role),
      name = COALESCE(user_name, user_profiles.name),
      phone = COALESCE(user_phone, user_profiles.phone),
      metadata = user_profiles.metadata || profile_metadata,
      updated_at = NOW()
    WHERE user_profiles.id = user_id;
  END IF;

  -- Log the profile creation/update
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    CASE WHEN is_new_user THEN 'user_profile_created' ELSE 'user_profile_updated' END,
    'user_profile',
    user_id,
    jsonb_build_object(
      'role', user_role,
      'is_new_user', is_new_user
    )
  );

  -- Return the profile
  RETURN QUERY 
  SELECT 
    up.id,
    up.email,
    up.role,
    up.name,
    up.phone,
    up.registration_status,
    up.created_at
  FROM user_profiles up
  WHERE up.id = user_id;
END;
$$;

-- Function to update registration progress
CREATE OR REPLACE FUNCTION update_registration_progress(
  new_step INTEGER,
  step_data JSONB DEFAULT '{}'::JSONB,
  force_update BOOLEAN DEFAULT false
)
RETURNS TABLE(
  current_step INTEGER,
  registration_status registration_status,
  completion_percentage INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  current_status registration_status;
  current_step_num INTEGER;
  total_steps INTEGER;
  completion_pct INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  user_id := auth.uid();

  -- Get current registration info
  SELECT registration_status, registration_step 
  INTO current_status, current_step_num
  FROM user_profiles 
  WHERE id = user_id;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Prevent going backwards unless forced
  IF new_step < current_step_num AND NOT force_update THEN
    RAISE EXCEPTION 'Cannot go backwards in registration steps';
  END IF;

  -- Determine total steps based on user role
  SELECT 
    CASE 
      WHEN role = 'restaurante' THEN 6  -- Business info, location, legal docs, branding, menu, review
      WHEN role = 'repartidor' THEN 5   -- Personal info, vehicle info, documents, background check, review
      WHEN role = 'cliente' THEN 3      -- Personal info, address setup, preferences
      ELSE 3
    END INTO total_steps
  FROM user_profiles 
  WHERE id = user_id;

  -- Calculate completion percentage
  completion_pct := LEAST(100, ROUND((new_step::DECIMAL / total_steps::DECIMAL) * 100));

  -- Update registration status based on progress
  current_status := CASE 
    WHEN new_step = 1 THEN 'draft'
    WHEN new_step < total_steps THEN 'in_progress'
    WHEN new_step = total_steps THEN 'pending_review'
    ELSE current_status
  END;

  -- Update user profile
  UPDATE user_profiles 
  SET 
    registration_step = new_step,
    registration_status = current_status,
    profile_completion_percentage = completion_pct,
    metadata = metadata || step_data,
    updated_at = NOW()
  WHERE id = user_id;

  -- Log the progress update
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    'registration_progress_updated',
    'user_profile',
    user_id,
    jsonb_build_object(
      'previous_step', current_step_num,
      'new_step', new_step,
      'completion_percentage', completion_pct,
      'status', current_status
    )
  );

  RETURN QUERY SELECT 
    new_step,
    current_status,
    completion_pct,
    NOW();
END;
$$;

-- ============================================================================
-- REGISTRATION STEP TRACKING FUNCTIONS
-- ============================================================================

-- Function to complete a registration step
CREATE OR REPLACE FUNCTION complete_registration_step(
  step_name TEXT,
  step_number INTEGER,
  completion_data JSONB DEFAULT '{}'::JSONB,
  is_required BOOLEAN DEFAULT true
)
RETURNS TABLE(
  step_id UUID,
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  step_id UUID;
  step_completed_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  user_id := auth.uid();

  -- Insert or update registration step
  INSERT INTO registration_steps (
    user_id,
    step_name,
    step_number,
    is_completed,
    is_required,
    completion_data,
    completed_at
  ) VALUES (
    user_id,
    step_name,
    step_number,
    true,
    is_required,
    completion_data,
    NOW()
  )
  ON CONFLICT (user_id, step_name) 
  DO UPDATE SET
    is_completed = true,
    completion_data = completion_data,
    completed_at = NOW(),
    updated_at = NOW()
  RETURNING registration_steps.id, registration_steps.completed_at 
  INTO step_id, step_completed_at;

  -- Update overall registration progress
  PERFORM update_registration_progress(step_number, completion_data);

  -- Log the step completion
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    'registration_step_completed',
    'registration_step',
    step_id,
    jsonb_build_object(
      'step_name', step_name,
      'step_number', step_number,
      'is_required', is_required
    )
  );

  RETURN QUERY SELECT 
    step_id,
    true,
    step_completed_at;
END;
$$;

-- Function to get registration progress
CREATE OR REPLACE FUNCTION get_registration_progress()
RETURNS TABLE(
  user_id UUID,
  current_step INTEGER,
  total_steps INTEGER,
  registration_status registration_status,
  completion_percentage INTEGER,
  completed_steps JSONB,
  required_steps JSONB,
  next_step_name TEXT,
  can_proceed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role user_role;
  total_step_count INTEGER;
  completed_step_data JSONB;
  required_step_data JSONB;
  next_step TEXT;
  can_continue BOOLEAN;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user profile info
  SELECT 
    up.role,
    up.registration_step,
    up.registration_status,
    up.profile_completion_percentage
  INTO user_role, current_step, registration_status, completion_percentage
  FROM user_profiles up
  WHERE up.id = auth.uid();

  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Determine total steps based on role
  total_step_count := CASE 
    WHEN user_role = 'restaurante' THEN 6
    WHEN user_role = 'repartidor' THEN 5
    WHEN user_role = 'cliente' THEN 3
    ELSE 3
  END;

  -- Get completed steps
  SELECT jsonb_agg(
    jsonb_build_object(
      'step_name', rs.step_name,
      'step_number', rs.step_number,
      'completed_at', rs.completed_at,
      'is_required', rs.is_required
    )
  ) INTO completed_step_data
  FROM registration_steps rs
  WHERE rs.user_id = auth.uid() AND rs.is_completed = true;

  -- Define required steps based on role
  required_step_data := CASE user_role
    WHEN 'restaurante' THEN '[
      {"step_name": "business_information", "step_number": 1},
      {"step_name": "location_address", "step_number": 2},
      {"step_name": "legal_documentation", "step_number": 3},
      {"step_name": "branding_media", "step_number": 4},
      {"step_name": "menu_creation", "step_number": 5},
      {"step_name": "review_submit", "step_number": 6}
    ]'::JSONB
    WHEN 'repartidor' THEN '[
      {"step_name": "personal_information", "step_number": 1},
      {"step_name": "vehicle_information", "step_number": 2},
      {"step_name": "documentation", "step_number": 3},
      {"step_name": "background_check", "step_number": 4},
      {"step_name": "review_submit", "step_number": 5}
    ]'::JSONB
    WHEN 'cliente' THEN '[
      {"step_name": "personal_information", "step_number": 1},
      {"step_name": "address_setup", "step_number": 2},
      {"step_name": "account_security", "step_number": 3}
    ]'::JSONB
    ELSE '[]'::JSONB
  END;

  -- Determine next step
  next_step := CASE 
    WHEN current_step < total_step_count THEN
      (SELECT step_name FROM jsonb_to_recordset(required_step_data) 
       AS x(step_name TEXT, step_number INTEGER) 
       WHERE step_number = current_step + 1 LIMIT 1)
    ELSE NULL
  END;

  -- Check if user can proceed
  can_continue := (
    registration_status IN ('draft', 'in_progress') AND 
    current_step <= total_step_count
  );

  RETURN QUERY SELECT 
    auth.uid(),
    current_step,
    total_step_count,
    registration_status,
    completion_percentage,
    COALESCE(completed_step_data, '[]'::JSONB),
    required_step_data,
    next_step,
    can_continue;
END;
$$;

-- ============================================================================
-- ROLE-SPECIFIC PROFILE CREATION FUNCTIONS
-- ============================================================================

-- Function to create restaurant profile
CREATE OR REPLACE FUNCTION create_restaurant_profile(
  restaurant_name TEXT,
  business_legal_name TEXT DEFAULT NULL,
  business_type business_type DEFAULT 'restaurant',
  cuisine_types TEXT[] DEFAULT '{}',
  description TEXT DEFAULT NULL,
  tax_id TEXT DEFAULT NULL,
  phone TEXT,
  email TEXT,
  website TEXT DEFAULT NULL,
  address TEXT,
  address_structured JSONB DEFAULT '{}'::JSONB,
  location_lat DECIMAL(10, 8) DEFAULT NULL,
  location_lon DECIMAL(11, 8) DEFAULT NULL,
  operating_hours JSONB DEFAULT '{}'::JSONB,
  brand_colors JSONB DEFAULT '{}'::JSONB,
  social_media_handles JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  id UUID,
  restaurant_name TEXT,
  approval_status registration_status,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  new_restaurant_id UUID;
  new_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  user_id := auth.uid();

  -- Verify user has restaurant role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = user_id AND role = 'restaurante'
  ) THEN
    RAISE EXCEPTION 'User must have restaurant role to create restaurant profile';
  END IF;

  -- Check if restaurant profile already exists
  IF EXISTS (SELECT 1 FROM restaurant_profiles WHERE user_id = create_restaurant_profile.user_id) THEN
    RAISE EXCEPTION 'Restaurant profile already exists for this user';
  END IF;

  -- Insert restaurant profile
  INSERT INTO restaurant_profiles (
    user_id,
    restaurant_name,
    business_legal_name,
    business_type,
    cuisine_types,
    description,
    tax_id,
    phone,
    email,
    website,
    address,
    address_structured,
    location_lat,
    location_lon,
    operating_hours,
    brand_colors,
    social_media_handles,
    approval_status
  ) VALUES (
    user_id,
    restaurant_name,
    business_legal_name,
    business_type,
    cuisine_types,
    description,
    tax_id,
    phone,
    email,
    website,
    address,
    address_structured,
    location_lat,
    location_lon,
    operating_hours,
    brand_colors,
    social_media_handles,
    'draft'
  )
  RETURNING restaurant_profiles.id, restaurant_profiles.created_at 
  INTO new_restaurant_id, new_created_at;

  -- Log the restaurant profile creation
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    'restaurant_profile_created',
    'restaurant_profile',
    new_restaurant_id,
    jsonb_build_object(
      'restaurant_name', restaurant_name,
      'business_type', business_type
    )
  );

  RETURN QUERY SELECT 
    new_restaurant_id,
    restaurant_name,
    'draft'::registration_status,
    new_created_at;
END;
$$;

-- Function to create customer profile
CREATE OR REPLACE FUNCTION create_customer_profile(
  customer_name TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE DEFAULT NULL,
  dietary_preferences TEXT[] DEFAULT '{}',
  favorite_cuisines TEXT[] DEFAULT '{}',
  preferred_language TEXT DEFAULT 'es',
  marketing_opt_in BOOLEAN DEFAULT false
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  new_customer_id UUID;
  new_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  user_id := auth.uid();

  -- Verify user has customer role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = user_id AND role = 'cliente'
  ) THEN
    RAISE EXCEPTION 'User must have customer role to create customer profile';
  END IF;

  -- Insert customer profile
  INSERT INTO customer_profiles (
    user_id,
    name,
    phone,
    email,
    date_of_birth,
    dietary_preferences,
    favorite_cuisines,
    preferred_language,
    marketing_opt_in
  ) VALUES (
    user_id,
    customer_name,
    phone,
    email,
    date_of_birth,
    dietary_preferences,
    favorite_cuisines,
    preferred_language,
    marketing_opt_in
  )
  RETURNING customer_profiles.id, customer_profiles.created_at 
  INTO new_customer_id, new_created_at;

  -- Log the customer profile creation
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    'customer_profile_created',
    'customer_profile',
    new_customer_id,
    jsonb_build_object(
      'name', customer_name,
      'marketing_opt_in', marketing_opt_in
    )
  );

  RETURN QUERY SELECT 
    new_customer_id,
    customer_name,
    email,
    new_created_at;
END;
$$;

-- Function to create delivery driver profile
CREATE OR REPLACE FUNCTION create_delivery_driver_profile(
  driver_name TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  vehicle_type vehicle_type,
  vehicle_make TEXT DEFAULT NULL,
  vehicle_model TEXT DEFAULT NULL,
  vehicle_year INTEGER DEFAULT NULL,
  vehicle_color TEXT DEFAULT NULL,
  vehicle_license_plate TEXT DEFAULT NULL,
  license_number TEXT DEFAULT NULL,
  license_expiry_date DATE DEFAULT NULL,
  preferred_work_areas TEXT[] DEFAULT '{}'
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  vehicle_type vehicle_type,
  approval_status registration_status,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  new_driver_id UUID;
  new_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  user_id := auth.uid();

  -- Verify user has driver role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = user_id AND role = 'repartidor'
  ) THEN
    RAISE EXCEPTION 'User must have delivery driver role to create driver profile';
  END IF;

  -- Insert delivery driver profile
  INSERT INTO delivery_driver_profiles (
    user_id,
    name,
    phone,
    email,
    date_of_birth,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    vehicle_type,
    vehicle_make,
    vehicle_model,
    vehicle_year,
    vehicle_color,
    vehicle_license_plate,
    license_number,
    license_expiry_date,
    preferred_work_areas,
    approval_status
  ) VALUES (
    user_id,
    driver_name,
    phone,
    email,
    date_of_birth,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    vehicle_type,
    vehicle_make,
    vehicle_model,
    vehicle_year,
    vehicle_color,
    vehicle_license_plate,
    license_number,
    license_expiry_date,
    preferred_work_areas,
    'draft'
  )
  RETURNING delivery_driver_profiles.id, delivery_driver_profiles.created_at 
  INTO new_driver_id, new_created_at;

  -- Log the driver profile creation
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    'driver_profile_created',
    'driver_profile',
    new_driver_id,
    jsonb_build_object(
      'name', driver_name,
      'vehicle_type', vehicle_type
    )
  );

  RETURN QUERY SELECT 
    new_driver_id,
    driver_name,
    vehicle_type,
    'draft'::registration_status,
    new_created_at;
END;
$$;

-- ============================================================================
-- REGISTRATION APPROVAL AND STATUS FUNCTIONS
-- ============================================================================

-- Function to submit registration for approval
CREATE OR REPLACE FUNCTION submit_registration_for_approval()
RETURNS TABLE(
  success BOOLEAN,
  registration_status registration_status,
  submitted_at TIMESTAMP WITH TIME ZONE,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_role user_role;
  current_status registration_status;
  current_step INTEGER;
  total_steps INTEGER;
  missing_requirements TEXT[] := '{}';
  profile_complete BOOLEAN;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  user_id := auth.uid();

  -- Get user info
  SELECT 
    up.role,
    up.registration_status,
    up.registration_step
  INTO user_role, current_status, current_step
  FROM user_profiles up
  WHERE up.id = user_id;

  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Determine total steps
  total_steps := CASE 
    WHEN user_role = 'restaurante' THEN 6
    WHEN user_role = 'repartidor' THEN 5
    WHEN user_role = 'cliente' THEN 3
    ELSE 3
  END;

  -- Check if registration is complete
  IF current_step < total_steps THEN
    missing_requirements := missing_requirements || format('Complete step %s of %s', current_step, total_steps);
  END IF;

  -- Role-specific validation
  CASE user_role
    WHEN 'restaurante' THEN
      -- Check restaurant profile exists
      IF NOT EXISTS (SELECT 1 FROM restaurant_profiles WHERE user_id = submit_registration_for_approval.user_id) THEN
        missing_requirements := missing_requirements || 'Restaurant profile required';
      END IF;
      
      -- Check document completeness
      SELECT is_complete INTO profile_complete
      FROM check_document_completeness('restaurante');
      
      IF NOT profile_complete THEN
        missing_requirements := missing_requirements || 'Required documents missing';
      END IF;

    WHEN 'repartidor' THEN
      -- Check driver profile exists
      IF NOT EXISTS (SELECT 1 FROM delivery_driver_profiles WHERE user_id = submit_registration_for_approval.user_id) THEN
        missing_requirements := missing_requirements || 'Driver profile required';
      END IF;
      
      -- Check document completeness
      SELECT is_complete INTO profile_complete
      FROM check_document_completeness('repartidor');
      
      IF NOT profile_complete THEN
        missing_requirements := missing_requirements || 'Required documents missing';
      END IF;

    WHEN 'cliente' THEN
      -- Check customer profile exists
      IF NOT EXISTS (SELECT 1 FROM customer_profiles WHERE user_id = submit_registration_for_approval.user_id) THEN
        missing_requirements := missing_requirements || 'Customer profile required';
      END IF;
  END CASE;

  -- If there are missing requirements, return error
  IF array_length(missing_requirements, 1) > 0 THEN
    RETURN QUERY SELECT 
      false,
      current_status,
      NULL::TIMESTAMP WITH TIME ZONE,
      'Registration incomplete: ' || array_to_string(missing_requirements, ', ');
    RETURN;
  END IF;

  -- Update user profile status
  UPDATE user_profiles 
  SET 
    registration_status = 'pending_review',
    updated_at = NOW()
  WHERE id = user_id;

  -- Update role-specific profile status
  CASE user_role
    WHEN 'restaurante' THEN
      UPDATE restaurant_profiles 
      SET approval_status = 'pending_review'
      WHERE user_id = submit_registration_for_approval.user_id;
    WHEN 'repartidor' THEN
      UPDATE delivery_driver_profiles 
      SET approval_status = 'pending_review'
      WHERE user_id = submit_registration_for_approval.user_id;
  END CASE;

  -- Log the submission
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    'registration_submitted_for_approval',
    'user_profile',
    user_id,
    jsonb_build_object(
      'role', user_role,
      'completed_steps', current_step,
      'total_steps', total_steps
    )
  );

  RETURN QUERY SELECT 
    true,
    'pending_review'::registration_status,
    NOW(),
    'Registration submitted successfully for approval';
END;
$$;

-- Function to approve or reject registration (admin function)
CREATE OR REPLACE FUNCTION update_registration_approval(
  target_user_id UUID,
  approval_decision registration_status, -- 'approved' or 'rejected'
  approval_notes TEXT DEFAULT NULL,
  approver_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  new_status registration_status,
  approved_at TIMESTAMP WITH TIME ZONE,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_role user_role;
  current_status registration_status;
  approval_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate approval decision
  IF approval_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid approval decision. Must be "approved" or "rejected"';
  END IF;

  -- Get target user info
  SELECT role, registration_status 
  INTO target_user_role, current_status
  FROM user_profiles 
  WHERE id = target_user_id;

  IF target_user_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF current_status != 'pending_review' THEN
    RAISE EXCEPTION 'User registration is not pending review';
  END IF;

  approval_timestamp := CASE WHEN approval_decision = 'approved' THEN NOW() ELSE NULL END;

  -- Update user profile
  UPDATE user_profiles 
  SET 
    registration_status = approval_decision,
    registration_completed_at = approval_timestamp,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Update role-specific profile
  CASE target_user_role
    WHEN 'restaurante' THEN
      UPDATE restaurant_profiles 
      SET 
        approval_status = approval_decision,
        approved_at = approval_timestamp,
        approved_by = COALESCE(approver_id, auth.uid()),
        rejection_reason = CASE WHEN approval_decision = 'rejected' THEN approval_notes ELSE NULL END
      WHERE user_id = target_user_id;
    WHEN 'repartidor' THEN
      UPDATE delivery_driver_profiles 
      SET 
        approval_status = approval_decision,
        approved_at = approval_timestamp,
        approved_by = COALESCE(approver_id, auth.uid()),
        rejection_reason = CASE WHEN approval_decision = 'rejected' THEN approval_notes ELSE NULL END
      WHERE user_id = target_user_id;
  END CASE;

  -- Log the approval/rejection
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    COALESCE(approver_id, auth.uid()),
    CASE WHEN approval_decision = 'approved' THEN 'registration_approved' ELSE 'registration_rejected' END,
    'user_profile',
    target_user_id,
    jsonb_build_object(
      'target_user_role', target_user_role,
      'approval_notes', approval_notes,
      'previous_status', current_status
    )
  );

  RETURN QUERY SELECT 
    true,
    approval_decision,
    approval_timestamp,
    CASE 
      WHEN approval_decision = 'approved' THEN 'Registration approved successfully'
      ELSE format('Registration rejected: %s', COALESCE(approval_notes, 'No reason provided'))
    END;
END;
$$;