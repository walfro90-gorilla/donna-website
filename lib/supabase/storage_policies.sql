-- Storage Policies for Donna Website

-- Enable RLS on objects table (usually enabled by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (if not already exists)
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- BUCKET: restaurant-images (Public)
-- Usage: Logos, Cover Images, Facade Images
-- ============================================================

-- Allow public read access to all files in restaurant-images
CREATE POLICY "Public Access to Restaurant Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'restaurant-images' );

-- Allow authenticated users (Restaurants/Admins) to upload
CREATE POLICY "Restaurants can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update/delete their own images
CREATE POLICY "Users can update their own restaurant images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'restaurant-images' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own restaurant images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'restaurant-images' AND owner = auth.uid() );


-- ============================================================
-- BUCKET: profile-images (Public)
-- Usage: User Avatars
-- ============================================================

-- Allow public read access
CREATE POLICY "Public Access to Profile Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-images' );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update/delete their own avatar
CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'profile-images' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING ( bucket_id = 'profile-images' AND owner = auth.uid() );


-- ============================================================
-- BUCKET: vehicle-images (Public)
-- Usage: Delivery Agent Vehicle Photos
-- ============================================================

-- Allow public read access
CREATE POLICY "Public Access to Vehicle Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vehicle-images' );

-- Allow authenticated users (Delivery Agents) to upload
CREATE POLICY "Delivery Agents can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update/delete their own vehicle images
CREATE POLICY "Users can update their own vehicle images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'vehicle-images' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own vehicle images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'vehicle-images' AND owner = auth.uid() );


-- ============================================================
-- BUCKET: Documents (Private)
-- Usage: Sensitive docs (IDs, Permits, Insurance)
-- ============================================================

-- Allow users to view their OWN documents, and Admins to view ALL
CREATE POLICY "Users can view own documents, Admins view all"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'Documents' AND
  (auth.uid() = owner OR auth.is_admin())
);

-- Allow authenticated users to upload documents
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'Documents' AND
  auth.role() = 'authenticated'
);

-- Allow users to update/delete their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'Documents' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING ( bucket_id = 'Documents' AND owner = auth.uid() );
