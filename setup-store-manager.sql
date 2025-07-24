-- Setup Store Manager for kafka user
-- This script ensures the kafka user is properly set up as a Store Manager

-- First, let's check if the kafka user exists in store_administrators
SELECT 
  sa.user_id,
  sa.store_id,
  sa.role,
  s.name as store_name,
  u.username,
  u.email
FROM store_administrators sa
JOIN stores s ON sa.store_id = s.id
JOIN users u ON sa.user_id = u.id
WHERE u.email = 'kafka@bookconnect.com';

-- If the above query returns no results, we need to insert the kafka user as a Store Manager
-- Insert kafka user as Store Manager for Default Store (if not exists)
INSERT INTO store_administrators (user_id, store_id, role, created_at, updated_at)
SELECT 
  u.id,
  s.id,
  'manager',
  NOW(),
  NOW()
FROM users u, stores s
WHERE u.email = 'kafka@bookconnect.com'
  AND s.name = 'Default Store'
  AND NOT EXISTS (
    SELECT 1 FROM store_administrators sa 
    WHERE sa.user_id = u.id AND sa.store_id = s.id AND sa.role = 'manager'
  );

-- Verify the insertion
SELECT 
  sa.user_id,
  sa.store_id,
  sa.role,
  s.name as store_name,
  u.username,
  u.email
FROM store_administrators sa
JOIN stores s ON sa.store_id = s.id
JOIN users u ON sa.user_id = u.id
WHERE u.email = 'kafka@bookconnect.com';
