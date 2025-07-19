-- User Account Management System - Database Foundation
-- Migration: 20250117_001_user_account_management_foundation.sql
-- Purpose: Add account status tracking and club suspension management
-- Phase: 1 - Database Foundation
-- Follows patterns from: 20250105_008_add_security_enhancements_CORRECTED.sql

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Extend users table with account management fields
-- =========================

-- Add account status tracking columns (all nullable for backward compatibility)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_status TEXT 
CHECK (account_status IS NULL OR account_status IN ('active', 'suspended', 'deleted'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status_changed_by UUID;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- =========================
-- Create club_suspensions table
-- =========================

CREATE TABLE IF NOT EXISTS club_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  club_id UUID NOT NULL,
  suspended_by UUID NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) >= 10),
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, club_id),
  CHECK (expires_at IS NULL OR expires_at > suspended_at)
);

-- =========================
-- Add foreign key constraints conditionally (following established pattern)
-- =========================

DO $$
BEGIN
  -- Add foreign key constraints for users table extensions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    -- Add FK for status_changed_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_users_status_changed_by' 
                   AND table_name = 'users') THEN
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_status_changed_by 
      FOREIGN KEY (status_changed_by) REFERENCES users(id);
    END IF;
    
    -- Add FK for deleted_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_users_deleted_by' 
                   AND table_name = 'users') THEN
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_deleted_by 
      FOREIGN KEY (deleted_by) REFERENCES users(id);
    END IF;
  END IF;
  
  -- Add foreign key constraints for club_suspensions table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_club_suspensions_user_id' 
                   AND table_name = 'club_suspensions') THEN
      ALTER TABLE club_suspensions 
      ADD CONSTRAINT fk_club_suspensions_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_club_suspensions_suspended_by' 
                   AND table_name = 'club_suspensions') THEN
      ALTER TABLE club_suspensions 
      ADD CONSTRAINT fk_club_suspensions_suspended_by 
      FOREIGN KEY (suspended_by) REFERENCES users(id);
    END IF;
  END IF;
  
  -- Add book_clubs FK if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_clubs' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_club_suspensions_club_id' 
                   AND table_name = 'club_suspensions') THEN
      ALTER TABLE club_suspensions 
      ADD CONSTRAINT fk_club_suspensions_club_id 
      FOREIGN KEY (club_id) REFERENCES book_clubs(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error but continue with migration (following established pattern)
  RAISE NOTICE 'Foreign key constraint creation failed: %', SQLERRM;
END $$;

-- =========================
-- Performance indexes (following established patterns)
-- =========================

-- Account status indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_account_status 
ON users(account_status) 
WHERE account_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at 
ON users(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_status_changed_at 
ON users(status_changed_at) 
WHERE status_changed_at IS NOT NULL;

-- Club suspensions indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_suspensions_user_active 
ON club_suspensions(user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_club_suspensions_club_active 
ON club_suspensions(club_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_club_suspensions_expires 
ON club_suspensions(expires_at) 
WHERE expires_at IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_club_suspensions_user_club 
ON club_suspensions(user_id, club_id);

-- =========================
-- Extend scheduled_tasks for account management (following established pattern)
-- =========================

-- Add new task types to support account management automation
DO $$
BEGIN
  -- Check if we need to extend task_type constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name LIKE '%task_type%' 
             AND table_name = 'scheduled_tasks') THEN
    -- Note: PostgreSQL doesn't allow easy constraint modification
    -- New task types will be validated at application level
    RAISE NOTICE 'Task type constraint exists - new types will be validated at application level';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Task type constraint check failed: %', SQLERRM;
END $$;

-- =========================
-- Comments for documentation
-- =========================

COMMENT ON COLUMN users.account_status IS 'Account status: active, suspended, or deleted. NULL means active (backward compatibility)';
COMMENT ON COLUMN users.status_changed_by IS 'User ID who changed the account status (for audit trail)';
COMMENT ON COLUMN users.status_changed_at IS 'Timestamp when account status was last changed';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when account was soft deleted (NULL means not deleted)';
COMMENT ON COLUMN users.deleted_by IS 'User ID who deleted the account (for audit trail)';

COMMENT ON TABLE club_suspensions IS 'Club-specific user suspensions with automatic escalation tracking';
COMMENT ON COLUMN club_suspensions.reason IS 'Reason for suspension (minimum 10 characters)';
COMMENT ON COLUMN club_suspensions.expires_at IS 'When suspension expires (NULL for permanent)';
COMMENT ON COLUMN club_suspensions.is_active IS 'Whether suspension is currently active';

-- =========================
-- Migration completion log
-- =========================

-- Log successful migration completion
DO $$
BEGIN
  RAISE NOTICE 'User Account Management Foundation migration completed successfully';
  RAISE NOTICE 'Added account status tracking to users table';
  RAISE NOTICE 'Created club_suspensions table with proper constraints';
  RAISE NOTICE 'Added performance indexes for efficient querying';
  RAISE NOTICE 'Ready for Phase 2: Core Account Management APIs';
END $$;
