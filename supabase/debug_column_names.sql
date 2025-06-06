-- DEBUG COLUMN NAMES - RLS is disabled, so this must be a column/table issue
-- Let's check the exact table structure

-- =========================
-- 1. CHECK EXACT TABLE STRUCTURE
-- =========================

-- Check all columns in users table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================
-- 2. TEST BASIC SELECT
-- =========================

-- Test if basic select works
SELECT COUNT(*) as total_users FROM public.users;

-- Test selecting just ID
SELECT id FROM public.users LIMIT 1;

-- =========================
-- 3. TEST EACH COLUMN INDIVIDUALLY
-- =========================

-- Test username column
SELECT id, username FROM public.users LIMIT 1;

-- Test displayname column (this might fail)
SELECT id, displayname FROM public.users LIMIT 1;

-- Test avatar_url column (this might fail)
SELECT id, avatar_url FROM public.users LIMIT 1;

-- =========================
-- 4. CHECK IF COLUMNS EXIST WITH DIFFERENT NAMES
-- =========================

-- Maybe it's display_name instead of displayname?
SELECT id, display_name FROM public.users LIMIT 1;

-- Maybe it's avatar instead of avatar_url?
SELECT id, avatar FROM public.users LIMIT 1;

-- =========================
-- 5. TEST THE EXACT FAILING QUERY STEP BY STEP
-- =========================

-- Test with just one user ID first
SELECT id 
FROM public.users 
WHERE id = 'd5329cc4-d896-4f7e-9f7f-be19a8dfd895';

-- Test with IN clause but just ID
SELECT id 
FROM public.users 
WHERE id IN (
  'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
  'f6cea68f-7e3e-4f18-9d1a-de90f30ecdcf'
);

-- Test adding username
SELECT id, username 
FROM public.users 
WHERE id IN (
  'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
  'f6cea68f-7e3e-4f18-9d1a-de90f30ecdcf'
);

-- =========================
-- 6. SHOW ALL AVAILABLE COLUMNS
-- =========================

-- This will show us exactly what columns exist
SELECT * FROM public.users LIMIT 1;
