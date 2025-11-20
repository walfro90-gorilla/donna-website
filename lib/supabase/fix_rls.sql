-- Fix RLS Recursion on 'restaurants' table

-- 1. Reset policies on restaurants
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies (names might vary, so we try common ones)
DROP POLICY IF EXISTS "Enable read access for all users" ON restaurants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON restaurants;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can manage their profile" ON restaurants;
DROP POLICY IF EXISTS "Public restaurants are viewable by everyone" ON restaurants;
DROP POLICY IF EXISTS "Users can update own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can insert own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON restaurants;

-- 2. Create Safe Policies for 'restaurants'
-- Allow public read access (needed for customers to see restaurants)
CREATE POLICY "Public restaurants are viewable by everyone" 
ON restaurants FOR SELECT 
USING (true);

-- Allow restaurant owners to update their own restaurant
-- This uses the JWT auth.uid() directly, avoiding recursion
CREATE POLICY "Users can update own restaurant" 
ON restaurants FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow restaurant owners to insert their own restaurant
CREATE POLICY "Users can insert own restaurant" 
ON restaurants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Fix 'products' table just in case
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public products view" ON products;
DROP POLICY IF EXISTS "Restaurant owners manage products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON products;

-- Create safe policies for 'products'
CREATE POLICY "Public products view" 
ON products FOR SELECT 
USING (true);

-- For writing products, we need to check if the user owns the restaurant.
-- This query touches 'restaurants'. Since we fixed 'restaurants' above to be non-recursive, this is safe.
CREATE POLICY "Restaurant owners manage products" 
ON products FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = products.restaurant_id 
    AND user_id = auth.uid()
  )
);
