-- Enhanced Database Schema for Rappi-Enhanced Registration System
-- This file contains the complete database schema for the enhanced registration features

-- ============================================================================
-- EXTENSIONS AND SETUP
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions;

-- ============================================================================
-- ENUMS AND CUSTOM TYPES
-- ============================================================================

-- User role types
CREATE TYPE user_role AS ENUM ('cliente', 'restaurante', 'repartidor');

-- Registration status types
CREATE TYPE registration_status AS ENUM ('draft', 'in_progress', 'pending_review', 'approved', 'rejected', 'suspended');

-- Document types for Mexican businesses
CREATE TYPE document_type AS ENUM (
  'rfc',
  'certificado_bancario', 
  'identificacion',
  'acta_constitutiva',
  'poder_legal',
  'comprobante_domicilio',
  'licencia_funcionamiento',
  'permiso_salubridad',
  'drivers_license',
  'vehicle_registration',
  'insurance_certificate',
  'background_check',
  'profile_image',
  'restaurant_logo',
  'restaurant_cover',
  'menu_item_image'
);

-- Document validation status
CREATE TYPE validation_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'resubmission_required');

-- Business types
CREATE TYPE business_type AS ENUM ('restaurant', 'cafe', 'bakery', 'food_truck', 'catering', 'bar', 'fast_food', 'fine_dining');

-- Vehicle types for delivery drivers
CREATE TYPE vehicle_type AS ENUM ('bicycle', 'motorcycle', 'car', 'scooter', 'walking');

-- Menu item status
CREATE TYPE menu_item_status AS ENUM ('active', 'inactive', 'out_of_stock', 'seasonal');

-- Background check status
CREATE TYPE background_check_status AS ENUM ('not_started', 'in_progress', 'completed', 'failed', 'expired');

-- ============================================================================
-- CORE USER TABLES (Enhanced)
-- ============================================================================

-- Enhanced user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  name TEXT,
  phone TEXT,
  registration_status registration_status DEFAULT 'draft',
  registration_step INTEGER DEFAULT 1,
  registration_completed_at TIMESTAMP WITH TIME ZONE,
  profile_completion_percentage INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant profiles with enhanced fields
CREATE TABLE IF NOT EXISTS restaurant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  business_legal_name TEXT,
  business_type business_type DEFAULT 'restaurant',
  cuisine_types TEXT[] DEFAULT '{}',
  description TEXT,
  tax_id TEXT, -- RFC in Mexico
  
  -- Contact information
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  
  -- Address information
  address TEXT NOT NULL,
  address_structured JSONB DEFAULT '{}',
  location_lat DECIMAL(10, 8),
  location_lon DECIMAL(11, 8),
  location_place_id TEXT,
  delivery_radius INTEGER DEFAULT 5000, -- meters
  
  -- Operating information
  operating_hours JSONB DEFAULT '{}',
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  estimated_delivery_time INTEGER DEFAULT 30, -- minutes
  
  -- Business settings
  commission_rate DECIMAL(5, 4) DEFAULT 0.15, -- 15% default
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  accepts_cash BOOLEAN DEFAULT true,
  accepts_cards BOOLEAN DEFAULT true,
  
  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,
  brand_colors JSONB DEFAULT '{}',
  social_media_handles JSONB DEFAULT '{}',
  
  -- Status and approval
  approval_status registration_status DEFAULT 'draft',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejection_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Customer profiles with enhanced address management
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE,
  
  -- Preferences
  dietary_preferences TEXT[] DEFAULT '{}',
  favorite_cuisines TEXT[] DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{}',
  
  -- Account settings
  preferred_language TEXT DEFAULT 'es',
  marketing_opt_in BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Customer addresses (multiple addresses per customer)
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'home', 'work', 'other'
  address TEXT NOT NULL,
  address_structured JSONB DEFAULT '{}',
  location_lat DECIMAL(10, 8),
  location_lon DECIMAL(11, 8),
  location_place_id TEXT,
  is_default BOOLEAN DEFAULT false,
  delivery_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery driver profiles with enhanced vehicle and document tracking
CREATE TABLE IF NOT EXISTS delivery_driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE,
  
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Vehicle information
  vehicle_type vehicle_type NOT NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  vehicle_license_plate TEXT,
  
  -- Insurance information
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_expiry_date DATE,
  
  -- Driver license information
  license_number TEXT,
  license_expiry_date DATE,
  license_class TEXT,
  
  -- Background check
  background_check_status background_check_status DEFAULT 'not_started',
  background_check_completed_at TIMESTAMP WITH TIME ZONE,
  background_check_expiry_date DATE,
  
  -- Work preferences
  preferred_work_areas TEXT[] DEFAULT '{}',
  max_delivery_distance INTEGER DEFAULT 10000, -- meters
  available_hours JSONB DEFAULT '{}',
  
  -- Status and approval
  approval_status registration_status DEFAULT 'draft',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejection_reason TEXT,
  
  -- Performance metrics
  total_deliveries INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  completion_rate DECIMAL(5, 4) DEFAULT 0,
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  current_location_lat DECIMAL(10, 8),
  current_location_lon DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================================
-- DOCUMENT MANAGEMENT TABLES (Enhanced)
-- ============================================================================

-- Enhanced documents table with better validation tracking
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- File information
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- Document classification
  document_type document_type NOT NULL,
  document_category TEXT, -- Additional categorization
  
  -- Validation information
  validation_status validation_status DEFAULT 'pending',
  validation_results JSONB DEFAULT '{}',
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID,
  rejection_reason TEXT,
  resubmission_count INTEGER DEFAULT 0,
  
  -- Expiry tracking
  expires_at TIMESTAMP WITH TIME ZONE,
  expiry_notification_sent BOOLEAN DEFAULT false,
  
  -- Metadata and audit
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_documents_user_id (user_id),
  INDEX idx_documents_type (document_type),
  INDEX idx_documents_status (validation_status),
  INDEX idx_documents_expiry (expires_at)
);

-- Document validation history for audit trail
CREATE TABLE IF NOT EXISTS document_validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  previous_status validation_status,
  new_status validation_status NOT NULL,
  validator_id UUID,
  validation_notes TEXT,
  validation_results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MENU MANAGEMENT TABLES
-- ============================================================================

-- Menu categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(restaurant_id, name)
);

-- Menu items with enhanced features
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  
  -- Basic information
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  
  -- Media
  image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  
  -- Detailed information
  ingredients TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  dietary_info TEXT[] DEFAULT '{}', -- vegetarian, vegan, gluten-free, etc.
  nutritional_info JSONB DEFAULT '{}',
  
  -- Preparation and availability
  preparation_time INTEGER DEFAULT 15, -- minutes
  is_available BOOLEAN DEFAULT true,
  status menu_item_status DEFAULT 'active',
  availability_schedule JSONB DEFAULT '{}',
  
  -- Pricing and options
  has_variants BOOLEAN DEFAULT false,
  variants JSONB DEFAULT '{}', -- size, extras, etc.
  
  -- Ordering and display
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REGISTRATION WORKFLOW TABLES
-- ============================================================================

-- Registration steps tracking
CREATE TABLE IF NOT EXISTS registration_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT true,
  completion_data JSONB DEFAULT '{}',
  validation_errors JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, step_name)
);

-- Registration sessions for progress tracking
CREATE TABLE IF NOT EXISTS registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_data JSONB DEFAULT '{}',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  completion_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT AND LOGGING TABLES
-- ============================================================================

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(registration_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Restaurant profiles indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_profiles_user_id ON restaurant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_profiles_status ON restaurant_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_restaurant_profiles_location ON restaurant_profiles USING GIST(ST_Point(location_lon, location_lat));
CREATE INDEX IF NOT EXISTS idx_restaurant_profiles_cuisine ON restaurant_profiles USING GIN(cuisine_types);

-- Customer profiles indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default) WHERE is_default = true;

-- Delivery driver profiles indexes
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON delivery_driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON delivery_driver_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_available ON delivery_driver_profiles(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_driver_profiles_location ON delivery_driver_profiles USING GIST(ST_Point(current_location_lon, current_location_lat));

-- Menu management indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON menu_categories(restaurant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON menu_items(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured) WHERE is_featured = true;

-- Registration workflow indexes
CREATE INDEX IF NOT EXISTS idx_registration_steps_user ON registration_steps(user_id, step_number);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_user ON registration_sessions(user_id, is_active);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON activity_log(resource_type, resource_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Restaurant profiles policies
CREATE POLICY "Restaurant owners can manage their profile" ON restaurant_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view approved restaurants" ON restaurant_profiles
  FOR SELECT USING (approval_status = 'approved');

-- Customer profiles policies
CREATE POLICY "Customers can manage their profile" ON customer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Customer addresses policies
CREATE POLICY "Customers can manage their addresses" ON customer_addresses
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM customer_profiles WHERE id = customer_addresses.customer_id
    )
  );

-- Delivery driver profiles policies
CREATE POLICY "Drivers can manage their profile" ON delivery_driver_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can manage their documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- Document validation history policies
CREATE POLICY "Users can view their document history" ON document_validation_history
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM documents WHERE id = document_validation_history.document_id
    )
  );

-- Menu categories policies
CREATE POLICY "Restaurant owners can manage their categories" ON menu_categories
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM restaurant_profiles WHERE id = menu_categories.restaurant_id
    )
  );

CREATE POLICY "Public can view active categories" ON menu_categories
  FOR SELECT USING (is_active = true);

-- Menu items policies
CREATE POLICY "Restaurant owners can manage their menu items" ON menu_items
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM restaurant_profiles WHERE id = menu_items.restaurant_id
    )
  );

CREATE POLICY "Public can view available menu items" ON menu_items
  FOR SELECT USING (is_available = true AND status = 'active');

-- Registration steps policies
CREATE POLICY "Users can manage their registration steps" ON registration_steps
  FOR ALL USING (auth.uid() = user_id);

-- Registration sessions policies
CREATE POLICY "Users can manage their registration sessions" ON registration_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Activity log policies
CREATE POLICY "Users can view their activity log" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_profiles_updated_at BEFORE UPDATE ON restaurant_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_driver_profiles_updated_at BEFORE UPDATE ON delivery_driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_steps_updated_at BEFORE UPDATE ON registration_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_sessions_updated_at BEFORE UPDATE ON registration_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKETS SETUP
-- ============================================================================

-- Create storage buckets (these need to be run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
--   ('documents', 'documents', false, 52428800, ARRAY['application/pdf','image/jpeg','image/jpg','image/png','image/webp']),
--   ('restaurant-images', 'restaurant-images', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
--   ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
--   ('profile-images', 'profile-images', true, 2097152, ARRAY['image/jpeg','image/jpg','image/png','image/webp']);

-- Storage policies for documents bucket (private)
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

-- Storage policies for public buckets
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