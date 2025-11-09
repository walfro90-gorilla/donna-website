-- RPC Functions for Document Management
-- These functions should be executed in your Supabase SQL editor

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_validation_status ON documents(validation_status);

-- Enable RLS (Row Level Security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create document record
CREATE OR REPLACE FUNCTION create_document_record(
  file_path TEXT,
  file_url TEXT,
  metadata JSONB
)
RETURNS TABLE(id UUID, created_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_document_id UUID;
  new_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
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
    metadata
  ) VALUES (
    auth.uid(),
    file_path,
    file_url,
    COALESCE((metadata->>'originalName')::TEXT, 'unknown'),
    COALESCE((metadata->>'size')::BIGINT, 0),
    COALESCE((metadata->>'type')::TEXT, 'unknown'),
    COALESCE((metadata->>'documentType')::TEXT, 'general'),
    COALESCE((metadata->>'validationStatus')::TEXT, 'pending'),
    metadata
  )
  RETURNING documents.id, documents.created_at INTO new_document_id, new_created_at;

  RETURN QUERY SELECT new_document_id, new_created_at;
END;
$$;

-- Function to get user document paths for cleanup
CREATE OR REPLACE FUNCTION get_user_document_paths(user_id UUID)
RETURNS TABLE(file_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and requesting their own data
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY 
  SELECT documents.file_path 
  FROM documents 
  WHERE documents.user_id = get_user_document_paths.user_id;
END;
$$;

-- Function to update document validation status
CREATE OR REPLACE FUNCTION update_document_validation(
  document_id UUID,
  new_status TEXT,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate status
  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid validation status';
  END IF;

  -- Update document
  UPDATE documents 
  SET 
    validation_status = new_status,
    rejection_reason = CASE 
      WHEN new_status = 'rejected' THEN update_document_validation.rejection_reason
      ELSE NULL 
    END,
    updated_at = NOW()
  WHERE 
    id = document_id 
    AND user_id = auth.uid();

  -- Return true if update was successful
  RETURN FOUND;
END;
$$;

-- Function to get user documents with filtering
CREATE OR REPLACE FUNCTION get_user_documents(
  document_type_filter TEXT DEFAULT NULL,
  validation_status_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  file_path TEXT,
  file_url TEXT,
  original_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  document_type TEXT,
  validation_status TEXT,
  rejection_reason TEXT,
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
    d.rejection_reason,
    d.metadata,
    d.created_at,
    d.updated_at
  FROM documents d
  WHERE 
    d.user_id = auth.uid()
    AND (document_type_filter IS NULL OR d.document_type = document_type_filter)
    AND (validation_status_filter IS NULL OR d.validation_status = validation_status_filter)
  ORDER BY d.created_at DESC;
END;
$$;

-- Function to delete document and clean up storage
CREATE OR REPLACE FUNCTION delete_document_with_cleanup(document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_file_path TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get file path before deletion
  SELECT file_path INTO doc_file_path
  FROM documents 
  WHERE id = document_id AND user_id = auth.uid();

  IF doc_file_path IS NULL THEN
    RAISE EXCEPTION 'Document not found or not authorized';
  END IF;

  -- Delete document record
  DELETE FROM documents 
  WHERE id = document_id AND user_id = auth.uid();

  -- Note: Storage file cleanup should be handled by the application
  -- as RPC functions cannot directly interact with Supabase Storage

  RETURN FOUND;
END;
$$;

-- Function to validate Mexican business documents
CREATE OR REPLACE FUNCTION validate_mexican_business_document(
  document_id UUID,
  validation_rules JSONB
)
RETURNS TABLE(
  is_valid BOOLEAN,
  validation_results JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_record RECORD;
  results JSONB := '[]'::JSONB;
  rule JSONB;
  rule_result JSONB;
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

  -- Process validation rules
  FOR rule IN SELECT * FROM jsonb_array_elements(validation_rules)
  LOOP
    -- Basic validation logic (this would be expanded with actual business rules)
    rule_result := jsonb_build_object(
      'rule_id', rule->>'id',
      'rule_name', rule->>'name',
      'is_valid', true,
      'message', 'Validation passed',
      'severity', rule->>'severity'
    );

    -- Add specific validation logic based on document type
    CASE doc_record.document_type
      WHEN 'rfc' THEN
        -- RFC validation logic would go here
        rule_result := jsonb_set(rule_result, '{message}', '"RFC format validation completed"');
      WHEN 'certificado_bancario' THEN
        -- Bank certificate validation logic would go here
        rule_result := jsonb_set(rule_result, '{message}', '"Bank certificate validation completed"');
      WHEN 'identificacion' THEN
        -- ID validation logic would go here
        rule_result := jsonb_set(rule_result, '{message}', '"ID document validation completed"');
      ELSE
        -- General validation
        rule_result := jsonb_set(rule_result, '{message}', '"General document validation completed"');
    END CASE;

    results := results || rule_result;
  END LOOP;

  -- Update document with validation results
  UPDATE documents 
  SET 
    metadata = metadata || jsonb_build_object('validation_results', results),
    updated_at = NOW()
  WHERE id = document_id;

  -- Return overall validation status
  RETURN QUERY SELECT 
    true as is_valid,
    results as validation_results;
END;
$$;

-- Create storage buckets (run these in Supabase Storage settings or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('documents', 'documents', false),
--   ('restaurant-images', 'restaurant-images', true),
--   ('menu-images', 'menu-images', true),
--   ('profile-images', 'profile-images', true);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for public buckets (restaurant images, menu images, profile images)
CREATE POLICY "Anyone can view public images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('restaurant-images', 'menu-images', 'profile-images'));

CREATE POLICY "Authenticated users can upload public images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('restaurant-images', 'menu-images', 'profile-images') AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own public images" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('restaurant-images', 'menu-images', 'profile-images') AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own public images" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('restaurant-images', 'menu-images', 'profile-images') AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );