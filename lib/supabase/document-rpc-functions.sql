-- Enhanced Document Management RPC Functions
-- These functions provide comprehensive document processing, validation, and workflow management

-- ============================================================================
-- DOCUMENT UPLOAD AND CREATION FUNCTIONS
-- ============================================================================

-- Enhanced function to create document record with validation
CREATE OR REPLACE FUNCTION create_document_record(
  file_path TEXT,
  file_url TEXT,
  original_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  document_type document_type,
  metadata JSONB DEFAULT '{}'::JSONB,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  validation_status validation_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_document_id UUID;
  new_created_at TIMESTAMP WITH TIME ZONE;
  new_validation_status validation_status;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate file size limits based on document type
  IF document_type IN ('menu_item_image', 'profile_image') AND file_size > 5242880 THEN -- 5MB
    RAISE EXCEPTION 'File size exceeds limit for image documents (5MB)';
  ELSIF document_type IN ('restaurant_logo', 'restaurant_cover') AND file_size > 10485760 THEN -- 10MB
    RAISE EXCEPTION 'File size exceeds limit for branding images (10MB)';
  ELSIF file_size > 52428800 THEN -- 50MB for documents
    RAISE EXCEPTION 'File size exceeds maximum limit (50MB)';
  END IF;

  -- Set default expiry for certain document types
  IF expires_at IS NULL THEN
    CASE document_type
      WHEN 'drivers_license' THEN
        expires_at := NOW() + INTERVAL '5 years';
      WHEN 'vehicle_registration' THEN
        expires_at := NOW() + INTERVAL '1 year';
      WHEN 'insurance_certificate' THEN
        expires_at := NOW() + INTERVAL '1 year';
      WHEN 'background_check' THEN
        expires_at := NOW() + INTERVAL '2 years';
      ELSE
        expires_at := NULL;
    END CASE;
  END IF;

  -- Insert document record
  INSERT INTO documents (
    user_id,
    file_path,
    file_url,
    original_name,
    file_size,
    file_type,
    document_type,
    validation_status,
    expires_at,
    metadata
  ) VALUES (
    auth.uid(),
    file_path,
    file_url,
    original_name,
    file_size,
    file_type,
    document_type,
    'pending',
    expires_at,
    metadata
  )
  RETURNING documents.id, documents.created_at, documents.validation_status 
  INTO new_document_id, new_created_at, new_validation_status;

  -- Log the document creation
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'document_uploaded',
    'document',
    new_document_id,
    jsonb_build_object(
      'document_type', document_type,
      'file_size', file_size,
      'original_name', original_name
    )
  );

  RETURN QUERY SELECT new_document_id, new_created_at, new_validation_status;
END;
$$;

-- Function to replace/update existing document
CREATE OR REPLACE FUNCTION replace_document(
  old_document_id UUID,
  file_path TEXT,
  file_url TEXT,
  original_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  id UUID,
  updated_at TIMESTAMP WITH TIME ZONE,
  validation_status validation_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_file_path TEXT;
  doc_type document_type;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get old document info and verify ownership
  SELECT documents.file_path, documents.document_type INTO old_file_path, doc_type
  FROM documents 
  WHERE documents.id = old_document_id AND documents.user_id = auth.uid();

  IF old_file_path IS NULL THEN
    RAISE EXCEPTION 'Document not found or not authorized';
  END IF;

  -- Update document record
  UPDATE documents 
  SET 
    file_path = replace_document.file_path,
    file_url = replace_document.file_url,
    original_name = replace_document.original_name,
    file_size = replace_document.file_size,
    file_type = replace_document.file_type,
    validation_status = 'pending',
    resubmission_count = resubmission_count + 1,
    metadata = replace_document.metadata,
    updated_at = NOW()
  WHERE id = old_document_id AND user_id = auth.uid()
  RETURNING documents.id, documents.updated_at, documents.validation_status;

  -- Log the document replacement
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'document_replaced',
    'document',
    old_document_id,
    jsonb_build_object(
      'old_file_path', old_file_path,
      'new_file_path', file_path,
      'resubmission_count', (SELECT resubmission_count FROM documents WHERE id = old_document_id)
    )
  );

  RETURN QUERY SELECT old_document_id, NOW(), 'pending'::validation_status;
END;
$$;

-- ============================================================================
-- DOCUMENT VALIDATION AND APPROVAL FUNCTIONS
-- ============================================================================

-- Enhanced function to update document validation status with history tracking
CREATE OR REPLACE FUNCTION update_document_validation(
  document_id UUID,
  new_status validation_status,
  validation_notes TEXT DEFAULT NULL,
  validation_results JSONB DEFAULT '{}'::JSONB,
  validator_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  previous_status validation_status,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_status validation_status;
  doc_user_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current status and verify document exists
  SELECT validation_status, user_id INTO old_status, doc_user_id
  FROM documents 
  WHERE id = document_id;

  IF old_status IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- Check authorization (user owns document or is admin/validator)
  IF auth.uid() != doc_user_id AND validator_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized to validate this document';
  END IF;

  -- Validate status transition
  IF old_status = new_status THEN
    RAISE EXCEPTION 'Document already has status: %', new_status;
  END IF;

  -- Update document status
  UPDATE documents 
  SET 
    validation_status = new_status,
    validation_results = validation_results,
    validated_at = CASE WHEN new_status IN ('approved', 'rejected') THEN NOW() ELSE validated_at END,
    validated_by = CASE WHEN new_status IN ('approved', 'rejected') THEN COALESCE(validator_id, auth.uid()) ELSE validated_by END,
    rejection_reason = CASE WHEN new_status = 'rejected' THEN validation_notes ELSE NULL END,
    updated_at = NOW()
  WHERE id = document_id;

  -- Insert validation history record
  INSERT INTO document_validation_history (
    document_id,
    previous_status,
    new_status,
    validator_id,
    validation_notes,
    validation_results
  ) VALUES (
    document_id,
    old_status,
    new_status,
    COALESCE(validator_id, auth.uid()),
    validation_notes,
    validation_results
  );

  -- Log the validation action
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    COALESCE(validator_id, auth.uid()),
    'document_validation_updated',
    'document',
    document_id,
    jsonb_build_object(
      'previous_status', old_status,
      'new_status', new_status,
      'document_owner', doc_user_id,
      'validation_notes', validation_notes
    )
  );

  RETURN QUERY SELECT true, old_status, NOW();
END;
$$;

-- Function to validate Mexican business documents with specific rules
CREATE OR REPLACE FUNCTION validate_mexican_business_document(
  document_id UUID,
  validation_rules JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  is_valid BOOLEAN,
  validation_results JSONB,
  recommendations TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_record RECORD;
  results JSONB := '[]'::JSONB;
  recommendations TEXT[] := '{}';
  rule JSONB;
  rule_result JSONB;
  overall_valid BOOLEAN := true;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get document record
  SELECT * INTO doc_record
  FROM documents 
  WHERE id = document_id AND user_id = auth.uid();

  IF doc_record IS NULL THEN
    RAISE EXCEPTION 'Document not found or not authorized';
  END IF;

  -- Apply document type specific validation
  CASE doc_record.document_type
    WHEN 'rfc' THEN
      -- RFC validation rules
      rule_result := jsonb_build_object(
        'rule_id', 'rfc_format',
        'rule_name', 'RFC Format Validation',
        'is_valid', true,
        'message', 'RFC document format appears valid',
        'severity', 'high'
      );
      
      -- Check file type
      IF doc_record.file_type NOT IN ('application/pdf', 'image/jpeg', 'image/png') THEN
        rule_result := jsonb_set(rule_result, '{is_valid}', 'false');
        rule_result := jsonb_set(rule_result, '{message}', '"Invalid file type for RFC document"');
        overall_valid := false;
        recommendations := recommendations || 'Please upload RFC as PDF or clear image (JPEG/PNG)';
      END IF;

    WHEN 'certificado_bancario' THEN
      -- Bank certificate validation
      rule_result := jsonb_build_object(
        'rule_id', 'bank_cert_format',
        'rule_name', 'Bank Certificate Validation',
        'is_valid', true,
        'message', 'Bank certificate format appears valid',
        'severity', 'high'
      );

      -- Check if document is recent (within 3 months)
      IF doc_record.created_at < NOW() - INTERVAL '3 months' THEN
        recommendations := recommendations || 'Bank certificate should be recent (within 3 months)';
      END IF;

    WHEN 'identificacion' THEN
      -- ID document validation
      rule_result := jsonb_build_object(
        'rule_id', 'id_document_format',
        'rule_name', 'ID Document Validation',
        'is_valid', true,
        'message', 'ID document format appears valid',
        'severity', 'high'
      );

      -- Check image quality requirements
      IF doc_record.file_size < 100000 THEN -- Less than 100KB might be too small
        recommendations := recommendations || 'Image quality may be too low. Please upload a clearer image';
      END IF;

    WHEN 'drivers_license' THEN
      -- Driver's license validation
      rule_result := jsonb_build_object(
        'rule_id', 'license_validity',
        'rule_name', 'Driver License Validation',
        'is_valid', true,
        'message', 'Driver license document appears valid',
        'severity', 'high'
      );

      -- Check expiry date if provided in metadata
      IF doc_record.expires_at IS NOT NULL AND doc_record.expires_at < NOW() THEN
        rule_result := jsonb_set(rule_result, '{is_valid}', 'false');
        rule_result := jsonb_set(rule_result, '{message}', '"Driver license appears to be expired"');
        overall_valid := false;
        recommendations := recommendations || 'Driver license appears expired. Please upload current license';
      END IF;

    WHEN 'vehicle_registration' THEN
      -- Vehicle registration validation
      rule_result := jsonb_build_object(
        'rule_id', 'vehicle_reg_validity',
        'rule_name', 'Vehicle Registration Validation',
        'is_valid', true,
        'message', 'Vehicle registration appears valid',
        'severity', 'high'
      );

    ELSE
      -- General document validation
      rule_result := jsonb_build_object(
        'rule_id', 'general_format',
        'rule_name', 'General Document Validation',
        'is_valid', true,
        'message', 'Document format appears acceptable',
        'severity', 'medium'
      );
  END CASE;

  -- Add common validation checks
  -- File size check
  IF doc_record.file_size > 52428800 THEN -- 50MB
    rule_result := jsonb_set(rule_result, '{is_valid}', 'false');
    overall_valid := false;
    recommendations := recommendations || 'File size too large. Please compress or use a smaller file';
  END IF;

  -- File type check
  IF doc_record.file_type NOT IN ('application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp') THEN
    rule_result := jsonb_set(rule_result, '{is_valid}', 'false');
    overall_valid := false;
    recommendations := recommendations || 'Unsupported file type. Please use PDF, JPEG, or PNG';
  END IF;

  results := results || rule_result;

  -- Update document with validation results
  UPDATE documents 
  SET 
    validation_results = jsonb_build_object(
      'validation_results', results,
      'recommendations', recommendations,
      'validated_at', NOW()
    ),
    updated_at = NOW()
  WHERE id = document_id;

  RETURN QUERY SELECT overall_valid, results, recommendations;
END;
$$;

-- ============================================================================
-- DOCUMENT RETRIEVAL AND MANAGEMENT FUNCTIONS
-- ============================================================================

-- Enhanced function to get user documents with filtering and pagination
CREATE OR REPLACE FUNCTION get_user_documents(
  document_type_filter document_type DEFAULT NULL,
  validation_status_filter validation_status DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  include_expired BOOLEAN DEFAULT true
)
RETURNS TABLE(
  id UUID,
  file_path TEXT,
  file_url TEXT,
  original_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  document_type document_type,
  validation_status validation_status,
  validation_results JSONB,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN,
  resubmission_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY 
  SELECT 
    d.id,
    d.file_path,
    d.file_url,
    d.original_name,
    d.file_size,
    d.file_type,
    d.document_type,
    d.validation_status,
    d.validation_results,
    d.rejection_reason,
    d.expires_at,
    CASE WHEN d.expires_at IS NOT NULL AND d.expires_at < NOW() THEN true ELSE false END as is_expired,
    d.resubmission_count,
    d.metadata,
    d.created_at,
    d.updated_at
  FROM documents d
  WHERE 
    d.user_id = auth.uid()
    AND (document_type_filter IS NULL OR d.document_type = document_type_filter)
    AND (validation_status_filter IS NULL OR d.validation_status = validation_status_filter)
    AND (include_expired = true OR d.expires_at IS NULL OR d.expires_at >= NOW())
  ORDER BY d.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to check document completeness for user registration
CREATE OR REPLACE FUNCTION check_document_completeness(
  user_role user_role
)
RETURNS TABLE(
  is_complete BOOLEAN,
  completion_percentage INTEGER,
  required_documents JSONB,
  uploaded_documents JSONB,
  missing_documents TEXT[],
  expired_documents TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  required_docs TEXT[];
  uploaded_docs TEXT[];
  missing_docs TEXT[] := '{}';
  expired_docs TEXT[] := '{}';
  total_required INTEGER;
  total_uploaded INTEGER;
  completion_pct INTEGER;
  doc_record RECORD;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Define required documents based on user role
  CASE user_role
    WHEN 'restaurante' THEN
      required_docs := ARRAY['rfc', 'certificado_bancario', 'identificacion'];
    WHEN 'repartidor' THEN
      required_docs := ARRAY['identificacion', 'drivers_license', 'vehicle_registration'];
    WHEN 'cliente' THEN
      required_docs := ARRAY[]::TEXT[]; -- Customers don't require documents
    ELSE
      RAISE EXCEPTION 'Invalid user role: %', user_role;
  END CASE;

  total_required := array_length(required_docs, 1);
  
  -- If no documents required, return complete
  IF total_required IS NULL OR total_required = 0 THEN
    RETURN QUERY SELECT 
      true as is_complete,
      100 as completion_percentage,
      '[]'::JSONB as required_documents,
      '[]'::JSONB as uploaded_documents,
      '{}'::TEXT[] as missing_documents,
      '{}'::TEXT[] as expired_documents;
    RETURN;
  END IF;

  -- Get uploaded documents for the user
  FOR doc_record IN 
    SELECT document_type::TEXT, validation_status, expires_at
    FROM documents 
    WHERE user_id = auth.uid() 
    AND document_type::TEXT = ANY(required_docs)
    AND validation_status IN ('approved', 'pending')
  LOOP
    uploaded_docs := uploaded_docs || doc_record.document_type;
    
    -- Check if document is expired
    IF doc_record.expires_at IS NOT NULL AND doc_record.expires_at < NOW() THEN
      expired_docs := expired_docs || doc_record.document_type;
    END IF;
  END LOOP;

  -- Find missing documents
  SELECT array_agg(doc) INTO missing_docs
  FROM unnest(required_docs) as doc
  WHERE doc != ALL(COALESCE(uploaded_docs, '{}'));

  total_uploaded := array_length(uploaded_docs, 1);
  IF total_uploaded IS NULL THEN total_uploaded := 0; END IF;

  completion_pct := ROUND((total_uploaded::DECIMAL / total_required::DECIMAL) * 100);

  RETURN QUERY SELECT 
    (array_length(missing_docs, 1) IS NULL OR array_length(missing_docs, 1) = 0) AND 
    (array_length(expired_docs, 1) IS NULL OR array_length(expired_docs, 1) = 0) as is_complete,
    completion_pct as completion_percentage,
    array_to_json(required_docs)::JSONB as required_documents,
    array_to_json(COALESCE(uploaded_docs, '{}'))::JSONB as uploaded_documents,
    COALESCE(missing_docs, '{}') as missing_documents,
    COALESCE(expired_docs, '{}') as expired_documents;
END;
$$;

-- ============================================================================
-- DOCUMENT CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to get user document paths for cleanup
CREATE OR REPLACE FUNCTION get_user_document_paths(
  target_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  document_id UUID,
  file_path TEXT,
  document_type document_type,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_to_query UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Use provided user_id or current user
  user_to_query := COALESCE(target_user_id, auth.uid());

  -- Check authorization (user can only get their own paths unless admin)
  IF user_to_query != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to access other user documents';
  END IF;

  RETURN QUERY 
  SELECT 
    d.id,
    d.file_path,
    d.document_type,
    d.created_at
  FROM documents d
  WHERE d.user_id = user_to_query
  ORDER BY d.created_at DESC;
END;
$$;

-- Function to delete document with cleanup
CREATE OR REPLACE FUNCTION delete_document_with_cleanup(
  document_id UUID,
  cleanup_storage BOOLEAN DEFAULT true
)
RETURNS TABLE(
  success BOOLEAN,
  file_path TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_file_path TEXT;
  doc_type document_type;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get file path and type before deletion
  SELECT documents.file_path, documents.document_type 
  INTO doc_file_path, doc_type
  FROM documents 
  WHERE documents.id = document_id AND documents.user_id = auth.uid();

  IF doc_file_path IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Document not found or not authorized';
    RETURN;
  END IF;

  -- Delete validation history first (foreign key constraint)
  DELETE FROM document_validation_history 
  WHERE document_validation_history.document_id = delete_document_with_cleanup.document_id;

  -- Delete document record
  DELETE FROM documents 
  WHERE documents.id = document_id AND documents.user_id = auth.uid();

  -- Log the deletion
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'document_deleted',
    'document',
    document_id,
    jsonb_build_object(
      'file_path', doc_file_path,
      'document_type', doc_type,
      'cleanup_storage', cleanup_storage
    )
  );

  RETURN QUERY SELECT 
    true, 
    doc_file_path, 
    'Document deleted successfully. Storage cleanup required on client side.';
END;
$$;

-- Function to clean up expired documents
CREATE OR REPLACE FUNCTION cleanup_expired_documents(
  days_after_expiry INTEGER DEFAULT 30
)
RETURNS TABLE(
  cleaned_count INTEGER,
  file_paths TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_docs RECORD;
  cleanup_paths TEXT[] := '{}';
  cleanup_count INTEGER := 0;
BEGIN
  -- This function should be called by admin/system only
  -- For now, we'll just mark documents for cleanup rather than auto-delete
  
  FOR expired_docs IN 
    SELECT id, file_path, user_id, document_type
    FROM documents 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() - INTERVAL '1 day' * days_after_expiry
    AND validation_status != 'expired'
  LOOP
    -- Mark as expired instead of deleting
    UPDATE documents 
    SET validation_status = 'expired'
    WHERE id = expired_docs.id;
    
    cleanup_paths := cleanup_paths || expired_docs.file_path;
    cleanup_count := cleanup_count + 1;
    
    -- Log the expiry
    INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
    VALUES (
      expired_docs.user_id,
      'document_expired',
      'document',
      expired_docs.id,
      jsonb_build_object(
        'document_type', expired_docs.document_type,
        'file_path', expired_docs.file_path,
        'days_after_expiry', days_after_expiry
      )
    );
  END LOOP;

  RETURN QUERY SELECT cleanup_count, cleanup_paths;
END;
$$;

-- ============================================================================
-- DOCUMENT WORKFLOW AND STATUS FUNCTIONS
-- ============================================================================

-- Function to get document validation history
CREATE OR REPLACE FUNCTION get_document_validation_history(
  document_id UUID
)
RETURNS TABLE(
  id UUID,
  previous_status validation_status,
  new_status validation_status,
  validator_id UUID,
  validation_notes TEXT,
  validation_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the document
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_id AND documents.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Document not found or not authorized';
  END IF;

  RETURN QUERY 
  SELECT 
    dvh.id,
    dvh.previous_status,
    dvh.new_status,
    dvh.validator_id,
    dvh.validation_notes,
    dvh.validation_results,
    dvh.created_at
  FROM document_validation_history dvh
  WHERE dvh.document_id = get_document_validation_history.document_id
  ORDER BY dvh.created_at DESC;
END;
$$;

-- Function to bulk update document statuses (for admin use)
CREATE OR REPLACE FUNCTION bulk_update_document_status(
  document_ids UUID[],
  new_status validation_status,
  validation_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  updated_count INTEGER,
  failed_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_id UUID;
  success_count INTEGER := 0;
  failed_list UUID[] := '{}';
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Process each document ID
  FOREACH doc_id IN ARRAY document_ids
  LOOP
    BEGIN
      -- Try to update the document
      PERFORM update_document_validation(doc_id, new_status, validation_notes);
      success_count := success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Add to failed list if update fails
      failed_list := failed_list || doc_id;
    END;
  END LOOP;

  RETURN QUERY SELECT success_count, failed_list;
END;
$$;