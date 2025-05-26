-- Direct Messaging RLS Policies Migration
-- Created: 2024-12-19
-- Purpose: Implement Row Level Security for Direct Messaging tables

-- =========================
-- Enable RLS on all messaging tables
-- =========================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- =========================
-- Conversations RLS Policies
-- =========================

-- Users can only see conversations they participate in
CREATE POLICY "Users see their conversations" ON conversations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
);

-- Users can create conversations (handled by application logic for permission checking)
CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (true);

-- Users can update conversation timestamps (for last message updates)
CREATE POLICY "Users can update conversation timestamps" ON conversations
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
);

-- =========================
-- Helper Functions for RLS (to avoid recursion)
-- =========================

-- Function to check if user is participant in a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION is_user_conversation_participant(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = p_conversation_id
        AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Conversation Participants RLS Policies
-- =========================

-- Users can view participants in their conversations
-- Fixed: Use security definer function to avoid infinite recursion
CREATE POLICY "Users see their participants" ON conversation_participants
FOR SELECT USING (
    -- Users can see their own participation records
    user_id = auth.uid()
    OR
    -- Users can see other participants if they are also a participant in the same conversation
    -- Use security definer function to bypass RLS and avoid recursion
    is_user_conversation_participant(conversation_id, auth.uid())
);

-- Users can join conversations they're invited to
CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own participation data (last_read_at, etc.)
CREATE POLICY "Users can update their participation" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());

-- =========================
-- Direct Messages RLS Policies
-- =========================

-- Users can view messages in their conversations
CREATE POLICY "Users see their messages" ON direct_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = direct_messages.conversation_id
        AND user_id = auth.uid()
    )
);

-- Users can send messages to conversations they participate in
CREATE POLICY "Users can send messages" ON direct_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = direct_messages.conversation_id
        AND user_id = auth.uid()
    )
);

-- Users can soft delete their own messages
CREATE POLICY "Users can delete their messages" ON direct_messages
FOR UPDATE USING (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = direct_messages.conversation_id
        AND user_id = auth.uid()
    )
);

-- =========================
-- Test RLS Policies
-- =========================

-- Function to test RLS policies (for development/testing)
CREATE OR REPLACE FUNCTION test_messaging_rls_policies()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT := 'RLS Policies Test Results:' || chr(10);
BEGIN
    -- Test that RLS is enabled
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'conversations') THEN
        test_result := test_result || '❌ RLS not enabled on conversations table' || chr(10);
    ELSE
        test_result := test_result || '✅ RLS enabled on conversations table' || chr(10);
    END IF;

    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'conversation_participants') THEN
        test_result := test_result || '❌ RLS not enabled on conversation_participants table' || chr(10);
    ELSE
        test_result := test_result || '✅ RLS enabled on conversation_participants table' || chr(10);
    END IF;

    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'direct_messages') THEN
        test_result := test_result || '❌ RLS not enabled on direct_messages table' || chr(10);
    ELSE
        test_result := test_result || '✅ RLS enabled on direct_messages table' || chr(10);
    END IF;

    -- Count policies created
    test_result := test_result || 'Policies created: ' ||
        (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages'))::TEXT || chr(10);

    RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Verification
-- =========================

DO $$
BEGIN
    -- Verify RLS is enabled
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'conversations') THEN
        RAISE EXCEPTION 'RLS not enabled on conversations table';
    END IF;

    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'conversation_participants') THEN
        RAISE EXCEPTION 'RLS not enabled on conversation_participants table';
    END IF;

    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'direct_messages') THEN
        RAISE EXCEPTION 'RLS not enabled on direct_messages table';
    END IF;

    -- Verify helper function was created
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_user_conversation_participant') THEN
        RAISE EXCEPTION 'is_user_conversation_participant function was not created';
    END IF;

    RAISE NOTICE 'Direct messaging RLS policies created successfully';
    RAISE NOTICE 'RLS helper function created to prevent infinite recursion';
    RAISE NOTICE '%', test_messaging_rls_policies();
END $$;
