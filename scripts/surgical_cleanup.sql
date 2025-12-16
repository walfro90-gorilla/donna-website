-- SURGICAL CLEANUP SCRIPT - REMOVING "GHOST TABLES"
--
-- This script removes tables that belong to a "Generic SaaS/Wallet" architecture
-- which are duplicative and conflicting with the actual "Delivery App" architecture.
--
-- TARGETS:
-- 1. transactions (Conflict with: account_transactions)
-- 2. wallets (Conflict with: accounts)
-- 3. services (Conflict with: products/restaurants)
-- 4. profiles (Conflict with: users + client_profiles)
--
-- NOTE: Always backup your data before running DROP commands.

-- 1. Remove 'transactions' (Ghost Table)
-- Explanation: The real financial ledger is 'account_transactions'.
DROP TABLE IF EXISTS public.transactions;

-- 2. Remove 'wallets' (Ghost Table)
-- Explanation: The real balance sheet is in 'accounts'.
DROP TABLE IF EXISTS public.wallets;

-- 3. Remove 'services' (Ghost Table)
-- Explanation: This app deals with 'products' and 'restaurants', not generic services.
DROP TABLE IF EXISTS public.services;

-- 4. Remove 'profiles' (Ghost Table)
-- Explanation: 'users' is the base identity. 'client_profiles', 'restaurants', etc. extend it.
-- 'profiles' is a redundant generic table often found in starter kits.
-- We must handle foreign key dependencies first if any exist (e.g. from services or wallets, which we just dropped).
DROP TABLE IF EXISTS public.profiles;

-- 5. Remove 'enhanced-schema' leftover tables if they exist
-- These were identified in the initial audit as part of the "Rappi-Clone" script insertion.
DROP TABLE IF EXISTS public.restaurant_profiles;
DROP TABLE IF EXISTS public.delivery_driver_profiles;
DROP TABLE IF EXISTS public.customer_profiles;
DROP TABLE IF EXISTS public.customer_addresses;
DROP TABLE IF EXISTS public.documents;
DROP TABLE IF EXISTS public.document_validation_history;
DROP TABLE IF EXISTS public.menu_categories;
DROP TABLE IF EXISTS public.menu_items;
DROP TABLE IF EXISTS public.registration_steps;
DROP TABLE IF EXISTS public.registration_sessions;
DROP TABLE IF EXISTS public.activity_log;
DROP TABLE IF EXISTS public.user_profiles; -- Often the root of the "enhanced" schema

-- Verification Query (Optional - Run separately)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
