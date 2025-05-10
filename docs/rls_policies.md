# Row Level Security (RLS) Policies

This document outlines the Row Level Security (RLS) policies implemented for the role system.

## Overview

Row Level Security (RLS) is a feature of PostgreSQL that allows us to restrict which rows a user can access in a table. We use RLS policies to enforce our entitlements-based authorization system at the database level.

## Tables with RLS Policies

### `stores` Table

```sql
-- Anyone can view stores
CREATE POLICY "Anyone can view stores"
ON stores
FOR SELECT
USING (true);

-- Only platform owner can insert stores
CREATE POLICY "Only platform owner can insert stores"
ON stores
FOR INSERT
WITH CHECK (false); -- To be replaced with actual platform owner check

-- Only platform owner can update stores
CREATE POLICY "Only platform owner can update stores"
ON stores
FOR UPDATE
USING (false); -- To be replaced with actual platform owner check

-- Only platform owner can delete stores
CREATE POLICY "Only platform owner can delete stores"
ON stores
FOR DELETE
USING (false); -- To be replaced with actual platform owner check
```

### `store_administrators` Table

```sql
-- Anyone can view store administrators
CREATE POLICY "Anyone can view store administrators"
ON store_administrators
FOR SELECT
USING (true);

-- Only store owners can insert store administrators
CREATE POLICY "Only store owners can insert store administrators"
ON store_administrators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = NEW.store_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Only store owners can update store administrators
CREATE POLICY "Only store owners can update store administrators"
ON store_administrators
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = store_administrators.store_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Only store owners can delete store administrators
CREATE POLICY "Only store owners can delete store administrators"
ON store_administrators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = store_administrators.store_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);
```

### `club_moderators` Table

```sql
-- Anyone can view club moderators
CREATE POLICY "Anyone can view club moderators"
ON club_moderators
FOR SELECT
USING (true);

-- Club leads and store admins can insert club moderators
CREATE POLICY "Club leads and store admins can insert club moderators"
ON club_moderators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id = NEW.club_id
    AND lead_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM store_administrators sa
    JOIN book_clubs bc ON sa.store_id = bc.store_id
    WHERE bc.id = NEW.club_id
    AND sa.user_id = auth.uid()
  )
);

-- Club leads and store admins can delete club moderators
CREATE POLICY "Club leads and store admins can delete club moderators"
ON club_moderators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id = club_moderators.club_id
    AND lead_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM store_administrators sa
    JOIN book_clubs bc ON sa.store_id = bc.store_id
    WHERE bc.id = club_moderators.club_id
    AND sa.user_id = auth.uid()
  )
);
```

### `book_clubs` Table

```sql
-- Users can view clubs based on their tier
CREATE OR REPLACE POLICY "Users can view clubs based on their tier"
ON book_clubs
FOR SELECT
USING (
  access_tier_required = 'free'
  OR (
    access_tier_required = 'all_premium' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND
      account_tier IN ('privileged', 'privileged_plus')
    )
  )
  OR (
    access_tier_required = 'privileged_plus' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND
      account_tier = 'privileged_plus'
    )
  )
  OR lead_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid() AND
    store_id = book_clubs.store_id
  )
);
```

## Helper Functions

### `has_account_tier`

```sql
-- Function to check if a user has a specific account tier
CREATE OR REPLACE FUNCTION has_account_tier(required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT account_tier INTO user_tier FROM users WHERE id = auth.uid();
  
  IF required_tier = 'free' THEN
    RETURN TRUE;
  ELSIF required_tier = 'privileged' THEN
    RETURN user_tier IN ('privileged', 'privileged_plus');
  ELSIF required_tier = 'privileged_plus' THEN
    RETURN user_tier = 'privileged_plus';
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_store_administrator`

```sql
-- Function to check if a user is a store administrator
CREATE OR REPLACE FUNCTION is_store_administrator(store_id UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role FROM store_administrators 
  WHERE store_administrators.store_id = is_store_administrator.store_id
  AND user_id = auth.uid();
  
  IF admin_role IS NULL THEN
    RETURN FALSE;
  ELSIF required_role IS NULL THEN
    RETURN TRUE;
  ELSIF required_role = 'owner' THEN
    RETURN admin_role = 'owner';
  ELSIF required_role = 'manager' THEN
    RETURN admin_role IN ('owner', 'manager');
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_club_lead`

```sql
-- Function to check if a user is a club lead
CREATE OR REPLACE FUNCTION is_club_lead(club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id = club_id
    AND lead_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_club_moderator`

```sql
-- Function to check if a user is a club moderator
CREATE OR REPLACE FUNCTION is_club_moderator(club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM club_moderators
    WHERE club_id = is_club_moderator.club_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Usage in Application

These RLS policies are used in conjunction with the entitlements-based authorization system to provide multiple layers of security:

1. **Client-side**: Entitlements are checked in the UI to show/hide elements
2. **API layer**: Entitlements are checked in API endpoints to authorize actions
3. **Database layer**: RLS policies enforce access control at the data level

This multi-layered approach ensures that even if one layer is bypassed, the others will still protect the data.
