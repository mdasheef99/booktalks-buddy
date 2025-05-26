-- Migration: Add reply functionality to direct messages
-- Date: 2024-12-20
-- Description: Adds reply_to_id field to support message threading

-- Add reply_to_id column to direct_messages table
ALTER TABLE direct_messages 
ADD COLUMN reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL;

-- Add index for better query performance on replies
CREATE INDEX idx_direct_messages_reply_to_id ON direct_messages(reply_to_id);

-- Add index for conversation + reply queries
CREATE INDEX idx_direct_messages_conversation_reply ON direct_messages(conversation_id, reply_to_id);

-- Update RLS policies to handle reply relationships
-- Users can read replies if they can read the original message
CREATE POLICY "Users can read message replies" ON direct_messages
FOR SELECT USING (
  -- User is participant in the conversation
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = direct_messages.conversation_id
    AND cp.user_id = auth.uid()
  )
  -- OR user can read the original message being replied to
  OR (
    reply_to_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM direct_messages original
      JOIN conversation_participants cp ON cp.conversation_id = original.conversation_id
      WHERE original.id = direct_messages.reply_to_id
      AND cp.user_id = auth.uid()
    )
  )
);

-- Comment on the new column
COMMENT ON COLUMN direct_messages.reply_to_id IS 'References the message being replied to for threading functionality';
