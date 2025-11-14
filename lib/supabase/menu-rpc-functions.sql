-- Menu Management RPC Functions
-- These functions provide comprehensive menu and category management for restaurants

-- ============================================================================
-- MENU CATEGORY MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create a new menu category
CREATE OR REPLACE FUNCTION create_menu_category(
  restaurant_id UUID,
  category_name TEXT,
  category_description TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_category_id UUID;
  new_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_profiles 
    WHERE restaurant_profiles.id = restaurant_id AND restaurant_profiles.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage this restaurant menu';
  END IF;

  -- Check if category name already exists for this restaurant
  IF EXISTS (
    SELECT 1 FROM menu_categories 
    WHERE menu_categories.restaurant_id = create_menu_category.restaurant_id 
    AND LOWER(menu_categories.name) = LOWER(category_name)
  ) THEN
    RAISE EXCEPTION 'Category with name "%" already exists', category_name;
  END IF;

  -- Insert new category
  INSERT INTO menu_categories (
    restaurant_id,
    name,
    description,
    sort_order,
    is_active
  ) VALUES (
    restaurant_id,
    category_name,
    category_description,
    sort_order,
    true
  )
  RETURNING menu_categories.id, menu_categories.created_at 
  INTO new_category_id, new_created_at;

  -- Log the category creation
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'menu_category_created',
    'menu_category',
    new_category_id,
    jsonb_build_object(
      'restaurant_id', restaurant_id,
      'category_name', category_name,
      'sort_order', sort_order
    )
  );

  RETURN QUERY SELECT 
    new_category_id,
    category_name,
    category_description,
    sort_order,
    new_created_at;
END;
$$;

-- Function to update menu category
CREATE OR REPLACE FUNCTION update_menu_category(
  category_id UUID,
  category_name TEXT DEFAULT NULL,
  category_description TEXT DEFAULT NULL,
  new_sort_order INTEGER DEFAULT NULL,
  is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  sort_order INTEGER,
  is_active BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restaurant_owner_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant that owns this category
  SELECT rp.user_id INTO restaurant_owner_id
  FROM menu_categories mc
  JOIN restaurant_profiles rp ON mc.restaurant_id = rp.id
  WHERE mc.id = category_id;

  IF restaurant_owner_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  IF restaurant_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to update this category';
  END IF;

  -- Update category
  UPDATE menu_categories 
  SET 
    name = COALESCE(category_name, menu_categories.name),
    description = COALESCE(category_description, menu_categories.description),
    sort_order = COALESCE(new_sort_order, menu_categories.sort_order),
    is_active = COALESCE(update_menu_category.is_active, menu_categories.is_active),
    updated_at = NOW()
  WHERE menu_categories.id = category_id
  RETURNING 
    menu_categories.id,
    menu_categories.name,
    menu_categories.description,
    menu_categories.sort_order,
    menu_categories.is_active,
    menu_categories.updated_at;

  -- Log the category update
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'menu_category_updated',
    'menu_category',
    category_id,
    jsonb_build_object(
      'updated_fields', jsonb_build_object(
        'name', category_name,
        'description', category_description,
        'sort_order', new_sort_order,
        'is_active', is_active
      )
    )
  );
END;
$$;

-- Function to delete menu category (and handle menu items)
CREATE OR REPLACE FUNCTION delete_menu_category(
  category_id UUID,
  move_items_to_category_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  moved_items_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restaurant_owner_id UUID;
  items_count INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant that owns this category
  SELECT rp.user_id INTO restaurant_owner_id
  FROM menu_categories mc
  JOIN restaurant_profiles rp ON mc.restaurant_id = rp.id
  WHERE mc.id = category_id;

  IF restaurant_owner_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  IF restaurant_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to delete this category';
  END IF;

  -- Count items in this category
  SELECT COUNT(*) INTO items_count
  FROM menu_items 
  WHERE category_id = delete_menu_category.category_id;

  -- Handle menu items
  IF items_count > 0 THEN
    IF move_items_to_category_id IS NOT NULL THEN
      -- Move items to another category
      UPDATE menu_items 
      SET category_id = move_items_to_category_id
      WHERE category_id = delete_menu_category.category_id;
    ELSE
      -- Set items to no category (NULL)
      UPDATE menu_items 
      SET category_id = NULL
      WHERE category_id = delete_menu_category.category_id;
    END IF;
  END IF;

  -- Delete the category
  DELETE FROM menu_categories WHERE id = category_id;

  -- Log the category deletion
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'menu_category_deleted',
    'menu_category',
    category_id,
    jsonb_build_object(
      'items_count', items_count,
      'moved_to_category', move_items_to_category_id
    )
  );

  RETURN QUERY SELECT 
    true,
    items_count,
    CASE 
      WHEN items_count = 0 THEN 'Category deleted successfully'
      WHEN move_items_to_category_id IS NOT NULL THEN 
        format('Category deleted and %s items moved to new category', items_count)
      ELSE 
        format('Category deleted and %s items moved to uncategorized', items_count)
    END;
END;
$$;

-- Function to get restaurant categories
CREATE OR REPLACE FUNCTION get_restaurant_categories(
  restaurant_id UUID,
  include_inactive BOOLEAN DEFAULT false
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  sort_order INTEGER,
  is_active BOOLEAN,
  items_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    mc.id,
    mc.name,
    mc.description,
    mc.sort_order,
    mc.is_active,
    COALESCE(item_counts.count, 0)::INTEGER as items_count,
    mc.created_at,
    mc.updated_at
  FROM menu_categories mc
  LEFT JOIN (
    SELECT 
      category_id, 
      COUNT(*)::INTEGER as count
    FROM menu_items 
    WHERE restaurant_id = get_restaurant_categories.restaurant_id
    GROUP BY category_id
  ) item_counts ON mc.id = item_counts.category_id
  WHERE 
    mc.restaurant_id = get_restaurant_categories.restaurant_id
    AND (include_inactive = true OR mc.is_active = true)
  ORDER BY mc.sort_order ASC, mc.name ASC;
END;
$$;

-- ============================================================================
-- MENU ITEM MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create a new menu item
CREATE OR REPLACE FUNCTION create_menu_item(
  restaurant_id UUID,
  category_id UUID DEFAULT NULL,
  item_name TEXT,
  item_description TEXT DEFAULT NULL,
  price DECIMAL(10, 2),
  image_url TEXT DEFAULT NULL,
  ingredients TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  dietary_info TEXT[] DEFAULT '{}',
  preparation_time INTEGER DEFAULT 15,
  variants JSONB DEFAULT '{}'::JSONB,
  sort_order INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_item_id UUID;
  new_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_profiles 
    WHERE restaurant_profiles.id = restaurant_id AND restaurant_profiles.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage this restaurant menu';
  END IF;

  -- Verify category belongs to restaurant (if provided)
  IF category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_categories 
    WHERE menu_categories.id = category_id AND menu_categories.restaurant_id = create_menu_item.restaurant_id
  ) THEN
    RAISE EXCEPTION 'Category does not belong to this restaurant';
  END IF;

  -- Validate price
  IF price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;

  -- Insert new menu item
  INSERT INTO menu_items (
    restaurant_id,
    category_id,
    name,
    description,
    price,
    image_url,
    ingredients,
    allergens,
    dietary_info,
    preparation_time,
    variants,
    sort_order,
    is_available,
    status
  ) VALUES (
    restaurant_id,
    category_id,
    item_name,
    item_description,
    price,
    image_url,
    ingredients,
    allergens,
    dietary_info,
    preparation_time,
    variants,
    sort_order,
    true,
    'active'
  )
  RETURNING menu_items.id, menu_items.created_at 
  INTO new_item_id, new_created_at;

  -- Log the item creation
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'menu_item_created',
    'menu_item',
    new_item_id,
    jsonb_build_object(
      'restaurant_id', restaurant_id,
      'category_id', category_id,
      'item_name', item_name,
      'price', price
    )
  );

  RETURN QUERY SELECT 
    new_item_id,
    item_name,
    item_description,
    price,
    image_url,
    new_created_at;
END;
$$;

-- Function to update menu item
CREATE OR REPLACE FUNCTION update_menu_item(
  item_id UUID,
  item_name TEXT DEFAULT NULL,
  item_description TEXT DEFAULT NULL,
  price DECIMAL(10, 2) DEFAULT NULL,
  category_id UUID DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  ingredients TEXT[] DEFAULT NULL,
  allergens TEXT[] DEFAULT NULL,
  dietary_info TEXT[] DEFAULT NULL,
  preparation_time INTEGER DEFAULT NULL,
  variants JSONB DEFAULT NULL,
  is_available BOOLEAN DEFAULT NULL,
  status menu_item_status DEFAULT NULL,
  sort_order INTEGER DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  is_available BOOLEAN,
  status menu_item_status,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restaurant_owner_id UUID;
  item_restaurant_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant that owns this item
  SELECT mi.restaurant_id, rp.user_id INTO item_restaurant_id, restaurant_owner_id
  FROM menu_items mi
  JOIN restaurant_profiles rp ON mi.restaurant_id = rp.id
  WHERE mi.id = item_id;

  IF restaurant_owner_id IS NULL THEN
    RAISE EXCEPTION 'Menu item not found';
  END IF;

  IF restaurant_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to update this menu item';
  END IF;

  -- Verify category belongs to restaurant (if provided)
  IF category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_categories 
    WHERE menu_categories.id = category_id AND menu_categories.restaurant_id = item_restaurant_id
  ) THEN
    RAISE EXCEPTION 'Category does not belong to this restaurant';
  END IF;

  -- Validate price if provided
  IF price IS NOT NULL AND price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;

  -- Update menu item
  UPDATE menu_items 
  SET 
    name = COALESCE(item_name, menu_items.name),
    description = COALESCE(item_description, menu_items.description),
    price = COALESCE(update_menu_item.price, menu_items.price),
    category_id = COALESCE(update_menu_item.category_id, menu_items.category_id),
    image_url = COALESCE(update_menu_item.image_url, menu_items.image_url),
    ingredients = COALESCE(ingredients, menu_items.ingredients),
    allergens = COALESCE(allergens, menu_items.allergens),
    dietary_info = COALESCE(dietary_info, menu_items.dietary_info),
    preparation_time = COALESCE(preparation_time, menu_items.preparation_time),
    variants = COALESCE(variants, menu_items.variants),
    is_available = COALESCE(is_available, menu_items.is_available),
    status = COALESCE(update_menu_item.status, menu_items.status),
    sort_order = COALESCE(sort_order, menu_items.sort_order),
    updated_at = NOW()
  WHERE menu_items.id = item_id
  RETURNING 
    menu_items.id,
    menu_items.name,
    menu_items.description,
    menu_items.price,
    menu_items.is_available,
    menu_items.status,
    menu_items.updated_at;

  -- Log the item update
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'menu_item_updated',
    'menu_item',
    item_id,
    jsonb_build_object(
      'updated_fields', jsonb_build_object(
        'name', item_name,
        'price', price,
        'category_id', category_id,
        'is_available', is_available,
        'status', status
      )
    )
  );
END;
$$;

-- Function to delete menu item
CREATE OR REPLACE FUNCTION delete_menu_item(
  item_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restaurant_owner_id UUID;
  item_name TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant that owns this item
  SELECT rp.user_id, mi.name INTO restaurant_owner_id, item_name
  FROM menu_items mi
  JOIN restaurant_profiles rp ON mi.restaurant_id = rp.id
  WHERE mi.id = item_id;

  IF restaurant_owner_id IS NULL THEN
    RAISE EXCEPTION 'Menu item not found';
  END IF;

  IF restaurant_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to delete this menu item';
  END IF;

  -- Delete the menu item
  DELETE FROM menu_items WHERE id = item_id;

  -- Log the item deletion
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'menu_item_deleted',
    'menu_item',
    item_id,
    jsonb_build_object(
      'item_name', item_name
    )
  );

  RETURN QUERY SELECT 
    true,
    format('Menu item "%s" deleted successfully', item_name);
END;
$$;

-- Function to get restaurant menu items
CREATE OR REPLACE FUNCTION get_restaurant_menu_items(
  restaurant_id UUID,
  category_id UUID DEFAULT NULL,
  include_unavailable BOOLEAN DEFAULT false,
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  category_id UUID,
  category_name TEXT,
  name TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  image_url TEXT,
  ingredients TEXT[],
  allergens TEXT[],
  dietary_info TEXT[],
  preparation_time INTEGER,
  variants JSONB,
  is_available BOOLEAN,
  status menu_item_status,
  sort_order INTEGER,
  view_count INTEGER,
  order_count INTEGER,
  rating DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    mi.id,
    mi.category_id,
    mc.name as category_name,
    mi.name,
    mi.description,
    mi.price,
    mi.image_url,
    mi.ingredients,
    mi.allergens,
    mi.dietary_info,
    mi.preparation_time,
    mi.variants,
    mi.is_available,
    mi.status,
    mi.sort_order,
    mi.view_count,
    mi.order_count,
    mi.rating,
    mi.created_at,
    mi.updated_at
  FROM menu_items mi
  LEFT JOIN menu_categories mc ON mi.category_id = mc.id
  WHERE 
    mi.restaurant_id = get_restaurant_menu_items.restaurant_id
    AND (category_id IS NULL OR mi.category_id = get_restaurant_menu_items.category_id)
    AND (include_unavailable = true OR mi.is_available = true)
    AND mi.status = 'active'
  ORDER BY 
    COALESCE(mc.sort_order, 999) ASC,
    mi.sort_order ASC,
    mi.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================================================
-- MENU VALIDATION AND APPROVAL FUNCTIONS
-- ============================================================================

-- Function to validate restaurant menu completeness
CREATE OR REPLACE FUNCTION validate_menu_completeness(
  restaurant_id UUID
)
RETURNS TABLE(
  is_complete BOOLEAN,
  total_categories INTEGER,
  total_items INTEGER,
  items_with_images INTEGER,
  items_with_descriptions INTEGER,
  completion_percentage INTEGER,
  recommendations TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cat_count INTEGER;
  item_count INTEGER;
  items_with_img INTEGER;
  items_with_desc INTEGER;
  completion_pct INTEGER;
  recommendations TEXT[] := '{}';
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_profiles 
    WHERE restaurant_profiles.id = restaurant_id AND restaurant_profiles.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to access this restaurant menu';
  END IF;

  -- Count categories
  SELECT COUNT(*) INTO cat_count
  FROM menu_categories 
  WHERE menu_categories.restaurant_id = validate_menu_completeness.restaurant_id 
  AND is_active = true;

  -- Count items
  SELECT COUNT(*) INTO item_count
  FROM menu_items 
  WHERE menu_items.restaurant_id = validate_menu_completeness.restaurant_id 
  AND status = 'active';

  -- Count items with images
  SELECT COUNT(*) INTO items_with_img
  FROM menu_items 
  WHERE menu_items.restaurant_id = validate_menu_completeness.restaurant_id 
  AND status = 'active' 
  AND image_url IS NOT NULL 
  AND image_url != '';

  -- Count items with descriptions
  SELECT COUNT(*) INTO items_with_desc
  FROM menu_items 
  WHERE menu_items.restaurant_id = validate_menu_completeness.restaurant_id 
  AND status = 'active' 
  AND description IS NOT NULL 
  AND description != '';

  -- Generate recommendations
  IF cat_count = 0 THEN
    recommendations := recommendations || 'Create at least one menu category';
  END IF;

  IF item_count < 3 THEN
    recommendations := recommendations || 'Add at least 3 menu items';
  END IF;

  IF item_count > 0 AND items_with_img::DECIMAL / item_count < 0.5 THEN
    recommendations := recommendations || 'Add images to at least 50% of menu items';
  END IF;

  IF item_count > 0 AND items_with_desc::DECIMAL / item_count < 0.8 THEN
    recommendations := recommendations || 'Add descriptions to at least 80% of menu items';
  END IF;

  -- Calculate completion percentage
  completion_pct := CASE 
    WHEN item_count = 0 THEN 0
    ELSE LEAST(100, (
      (CASE WHEN cat_count > 0 THEN 25 ELSE 0 END) +
      (CASE WHEN item_count >= 3 THEN 25 ELSE (item_count * 8) END) +
      (CASE WHEN item_count > 0 THEN (items_with_img * 25 / item_count) ELSE 0 END) +
      (CASE WHEN item_count > 0 THEN (items_with_desc * 25 / item_count) ELSE 0 END)
    ))
  END;

  RETURN QUERY SELECT 
    (cat_count > 0 AND item_count >= 3 AND array_length(recommendations, 1) IS NULL) as is_complete,
    cat_count as total_categories,
    item_count as total_items,
    items_with_img as items_with_images,
    items_with_desc as items_with_descriptions,
    completion_pct as completion_percentage,
    COALESCE(recommendations, '{}') as recommendations;
END;
$$;

-- Function to bulk update menu item availability
CREATE OR REPLACE FUNCTION bulk_update_menu_availability(
  restaurant_id UUID,
  item_ids UUID[] DEFAULT NULL,
  is_available BOOLEAN DEFAULT true,
  category_id UUID DEFAULT NULL
)
RETURNS TABLE(
  updated_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_count INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_profiles 
    WHERE restaurant_profiles.id = restaurant_id AND restaurant_profiles.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage this restaurant menu';
  END IF;

  -- Update items based on criteria
  IF item_ids IS NOT NULL THEN
    -- Update specific items
    UPDATE menu_items 
    SET is_available = bulk_update_menu_availability.is_available, updated_at = NOW()
    WHERE menu_items.restaurant_id = bulk_update_menu_availability.restaurant_id
    AND id = ANY(item_ids);
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
  ELSIF category_id IS NOT NULL THEN
    -- Update all items in category
    UPDATE menu_items 
    SET is_available = bulk_update_menu_availability.is_available, updated_at = NOW()
    WHERE menu_items.restaurant_id = bulk_update_menu_availability.restaurant_id
    AND menu_items.category_id = bulk_update_menu_availability.category_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
  ELSE
    -- Update all items
    UPDATE menu_items 
    SET is_available = bulk_update_menu_availability.is_available, updated_at = NOW()
    WHERE menu_items.restaurant_id = bulk_update_menu_availability.restaurant_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
  END IF;

  -- Log the bulk update
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'menu_bulk_availability_update',
    'restaurant',
    restaurant_id,
    jsonb_build_object(
      'updated_count', update_count,
      'is_available', is_available,
      'category_id', category_id,
      'item_ids', item_ids
    )
  );

  RETURN QUERY SELECT 
    update_count,
    format('%s menu items updated', update_count);
END;
$$;