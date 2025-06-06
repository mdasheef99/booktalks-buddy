# Direct Messaging System - Database Design

## Overview

This document details the database schema, security policies, and data management strategies for the BookConnect Direct Messaging system. The design prioritizes simplicity, security, and extensibility while supporting tier-based message retention policies.

## Message Retention Policies

### Tier-Based Retention
- **Free Tier**: 30 days message retention
- **Privileged Tier**: 180 days message retention  
- **Privileged Plus Tier**: 365 days message retention (1 year)

### Implementation Strategy
- **Soft Delete Approach**: Messages marked as `is_deleted` rather than hard deletion
- **Background Cleanup**: Scheduled processes to permanently remove expired messages
- **Tier Downgrade Handling**: 30-day grace period before applying new retention policy

## Core Database Schema

### Table 1: conversations

```sql
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose**: Central conversation management with store-level isolation

**Key Design Decisions**:
- `store_id` ensures complete tenant isolation
- `updated_at` enables efficient conversation sorting
- Minimal fields for maximum simplicity

### Table 2: conversation_participants

```sql
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);
```

**Purpose**: Many-to-many relationship between users and conversations

**Key Design Decisions**:
- Composite primary key prevents duplicate participants
- `last_read_at` enables unread message tracking
- Extensible for future group messaging support

### Table 3: direct_messages

```sql
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
```

**Purpose**: Message storage with retention policy support

**Key Design Decisions**:
- `content` limited to 1000 characters for performance
- `is_deleted` enables soft delete functionality
- `retention_expires_at` supports automated cleanup based on user tier
- `deleted_at` tracks when message was soft deleted

## Performance Optimization

### Essential Indexes

```sql
-- Conversation lookup optimization
CREATE INDEX idx_conversations_store_id ON conversations(store_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Participant lookup optimization  
CREATE INDEX idx_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation_id ON conversation_participants(conversation_id);

-- Message query optimization
CREATE INDEX idx_messages_conversation_sent ON direct_messages(conversation_id, sent_at DESC);
CREATE INDEX idx_messages_sender_id ON direct_messages(sender_id);

-- Retention policy optimization
CREATE INDEX idx_messages_retention_expires ON direct_messages(retention_expires_at) 
WHERE retention_expires_at IS NOT NULL;

-- Soft delete optimization
CREATE INDEX idx_messages_active ON direct_messages(conversation_id, sent_at DESC) 
WHERE is_deleted = false;
```

### Query Performance Considerations

**Conversation List Query**:
- Optimized for user's active conversations
- Efficient sorting by `updated_at`
- Minimal data transfer with selective joins

**Message History Query**:
- Paginated loading for large conversations
- Filtered by `is_deleted = false`
- Ordered by `sent_at` for chronological display

**Real-Time Query Efficiency**:
- Targeted subscriptions by `conversation_id`
- Minimal payload for real-time updates
- Efficient filtering at database level

## Row Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
```

### Conversations Security

```sql
-- Users can only see conversations they participate in
CREATE POLICY "Users see their conversations" ON conversations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
);

-- Users can create conversations (handled by application logic)
CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (true);

-- Users can update conversation timestamps
CREATE POLICY "Users can update conversation timestamps" ON conversations
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
);
```

### Participants Security

```sql
-- Users can view participants in their conversations
CREATE POLICY "Users see their participants" ON conversation_participants
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id 
        AND cp.user_id = auth.uid()
    )
);

-- Users can join conversations they're invited to
CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own participation data
CREATE POLICY "Users can update their participation" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());
```

### Messages Security

```sql
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
```

## Data Management Functions

### Retention Policy Enforcement

```sql
-- Function to set retention expiration based on user tier
CREATE OR REPLACE FUNCTION set_message_retention()
RETURNS TRIGGER AS $$
BEGIN
    -- Get sender's tier and set retention accordingly
    SELECT CASE 
        WHEN user_tier = 'privileged_plus' THEN NEW.sent_at + INTERVAL '365 days'
        WHEN user_tier = 'privileged' THEN NEW.sent_at + INTERVAL '180 days'
        ELSE NEW.sent_at + INTERVAL '30 days'
    END INTO NEW.retention_expires_at
    FROM users 
    WHERE id = NEW.sender_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set retention on message insert
CREATE TRIGGER set_message_retention_trigger
    BEFORE INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_message_retention();
```

### Cleanup Functions

```sql
-- Function to clean up expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM direct_messages 
    WHERE retention_expires_at < NOW() 
    AND is_deleted = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete expired messages (first step)
CREATE OR REPLACE FUNCTION soft_delete_expired_messages()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE direct_messages 
    SET is_deleted = true, deleted_at = NOW()
    WHERE retention_expires_at < NOW() 
    AND is_deleted = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### Migration File Structure

```
supabase/migrations/
├── YYYYMMDD_001_direct_messaging_schema.sql
├── YYYYMMDD_002_direct_messaging_rls.sql
├── YYYYMMDD_003_direct_messaging_indexes.sql
├── YYYYMMDD_004_direct_messaging_functions.sql
└── YYYYMMDD_005_direct_messaging_triggers.sql
```

### Rollback Considerations

**Schema Rollback**:
- Drop tables in reverse dependency order
- Remove indexes and triggers
- Clean up functions and policies

**Data Migration Safety**:
- Test migrations on staging environment
- Backup existing data before schema changes
- Validate data integrity after migration

## Capacity Planning

### Storage Estimates

**Message Storage**:
- Average message: ~100 characters = ~100 bytes
- 500 users × 50 messages/day × 365 days = ~1.8GB/year
- With retention policies: ~500MB active storage per store

**Index Overhead**:
- Estimated 20-30% additional storage for indexes
- Total storage per store: ~650MB including indexes

### Performance Targets

**Query Performance**:
- Conversation list: < 100ms
- Message history (50 messages): < 200ms
- Real-time message delivery: < 2 seconds

**Concurrent User Support**:
- Target: 300-500 concurrent active users
- Maximum: Under 1000 concurrent users
- Database connections: Optimized connection pooling

## Related Documents

- **[Architecture Overview](./architecture_overview.md)**: High-level system design and patterns
- **[API Specification](./api_specification.md)**: Database interaction functions and types
- **[Frontend Implementation](./frontend_implementation.md)**: UI components using this data model
- **[Deployment Guide](./deployment_guide.md)**: Migration execution and database setup

## Implementation Notes

1. **Migration Execution**: Run migrations in sequence during deployment
2. **Testing Strategy**: Validate RLS policies with different user contexts
3. **Performance Monitoring**: Track query performance and optimize indexes as needed
4. **Backup Strategy**: Regular backups with point-in-time recovery capability
5. **Maintenance**: Schedule regular cleanup of expired messages
