-- Direct Messaging Schema Migration
-- Created: 2024-12-19
-- Purpose: Create core tables for Direct Messaging system

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Create conversations table
-- =========================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE conversations IS 'Direct messaging conversations between users within a store';
COMMENT ON COLUMN conversations.store_id IS 'References the store to enforce tenant isolation';
COMMENT ON COLUMN conversations.updated_at IS 'Updated when new messages are sent for conversation ordering';

-- =========================
-- Create conversation_participants table
-- =========================
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Add comment for documentation
COMMENT ON TABLE conversation_participants IS 'Many-to-many relationship between users and conversations';
COMMENT ON COLUMN conversation_participants.last_read_at IS 'Used to calculate unread message counts';

-- =========================
-- Create direct_messages table
-- =========================
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 1000),
    sent_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    retention_expires_at TIMESTAMPTZ NULL
);

-- Add comment for documentation
COMMENT ON TABLE direct_messages IS 'Individual messages within conversations';
COMMENT ON COLUMN direct_messages.content IS 'Message content limited to 1000 characters';
COMMENT ON COLUMN direct_messages.is_deleted IS 'Soft delete flag for message removal';
COMMENT ON COLUMN direct_messages.retention_expires_at IS 'When message should be permanently deleted based on user tier';

-- =========================
-- Create indexes for performance
-- =========================

-- Conversation lookup indexes
CREATE INDEX IF NOT EXISTS idx_conversations_store_id ON conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Participant lookup indexes  
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation_id ON conversation_participants(conversation_id);

-- Message query indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent ON direct_messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON direct_messages(sender_id);

-- Retention policy indexes
CREATE INDEX IF NOT EXISTS idx_messages_retention_expires ON direct_messages(retention_expires_at) 
WHERE retention_expires_at IS NOT NULL;

-- Active messages index (excludes soft deleted)
CREATE INDEX IF NOT EXISTS idx_messages_active ON direct_messages(conversation_id, sent_at DESC) 
WHERE is_deleted = false;

-- =========================
-- Verification queries
-- =========================

-- Verify tables were created
DO $$
BEGIN
    -- Check if all tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        RAISE EXCEPTION 'conversations table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants') THEN
        RAISE EXCEPTION 'conversation_participants table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages') THEN
        RAISE EXCEPTION 'direct_messages table was not created';
    END IF;
    
    RAISE NOTICE 'Direct messaging schema created successfully';
END $$;
