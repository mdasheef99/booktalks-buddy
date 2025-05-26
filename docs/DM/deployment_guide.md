# Direct Messaging System - Deployment Guide

## Overview

This document provides comprehensive deployment instructions for the BookConnect Direct Messaging system, designed for single-tenant deployments with complete store isolation.

## Single-Tenant Architecture

### Deployment Model
- **One deployment per bookstore customer**
- **Separate database credentials** per store instance
- **Independent scaling** and resource allocation
- **Complete data isolation** between customers

### Environment Configuration
Each store deployment requires its own environment configuration with unique database credentials and settings.

## Pre-Deployment Requirements

### System Requirements
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **Supabase Project**: Dedicated project per store
- **Domain/Subdomain**: Unique URL per store deployment

### Database Prerequisites
- Supabase PostgreSQL database
- Row Level Security (RLS) enabled
- Existing BookConnect schema and data
- Database migration capability

## Database Migration Process

### Migration Files Structure

```
supabase/migrations/
├── YYYYMMDD_001_direct_messaging_schema.sql
├── YYYYMMDD_002_direct_messaging_rls.sql
├── YYYYMMDD_003_direct_messaging_indexes.sql
├── YYYYMMDD_004_direct_messaging_functions.sql
└── YYYYMMDD_005_direct_messaging_triggers.sql
```

### Migration Execution Steps

1. **Backup Existing Database**
   ```bash
   # Create backup before migration
   supabase db dump --file backup_pre_dm_$(date +%Y%m%d).sql
   ```

2. **Run Schema Migration**
   ```sql
   -- File: YYYYMMDD_001_direct_messaging_schema.sql
   
   -- Enable pgcrypto for UUID generation
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   
   -- Create conversations table
   CREATE TABLE IF NOT EXISTS conversations (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
       created_at TIMESTAMPTZ DEFAULT now(),
       updated_at TIMESTAMPTZ DEFAULT now()
   );
   
   -- Create conversation_participants table
   CREATE TABLE IF NOT EXISTS conversation_participants (
       conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
       joined_at TIMESTAMPTZ DEFAULT now(),
       last_read_at TIMESTAMPTZ DEFAULT now(),
       PRIMARY KEY (conversation_id, user_id)
   );
   
   -- Create direct_messages table
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

3. **Apply RLS Policies**
   ```sql
   -- File: YYYYMMDD_002_direct_messaging_rls.sql
   
   -- Enable RLS on all messaging tables
   ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
   ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
   
   -- Apply security policies (see database_design.md for complete policies)
   ```

4. **Create Performance Indexes**
   ```sql
   -- File: YYYYMMDD_003_direct_messaging_indexes.sql
   
   CREATE INDEX idx_conversations_store_id ON conversations(store_id);
   CREATE INDEX idx_participants_user_id ON conversation_participants(user_id);
   CREATE INDEX idx_messages_conversation_sent ON direct_messages(conversation_id, sent_at DESC);
   -- Additional indexes as specified in database_design.md
   ```

5. **Install Functions and Triggers**
   ```sql
   -- File: YYYYMMDD_004_direct_messaging_functions.sql
   -- File: YYYYMMDD_005_direct_messaging_triggers.sql
   
   -- Retention policy functions and triggers
   -- See database_design.md for complete function definitions
   ```

### Migration Validation

```bash
# Verify tables were created
supabase db inspect

# Test RLS policies
supabase db test

# Validate indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages');
```

## Environment Configuration

### Environment Variables

Create `.env.local` file for each store deployment:

```bash
# Supabase Configuration (Unique per store)
VITE_SUPABASE_URL=https://your-store-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-store-anon-key

# Store-Specific Configuration
VITE_STORE_NAME="Your Bookstore Name"
VITE_STORE_ID=your-store-uuid

# Messaging Configuration
VITE_MESSAGING_ENABLED=true
VITE_MAX_MESSAGE_LENGTH=1000
VITE_REALTIME_ENABLED=true

# Retention Policies
VITE_FREE_TIER_RETENTION_DAYS=30
VITE_PRIVILEGED_RETENTION_DAYS=180
VITE_PRIVILEGED_PLUS_RETENTION_DAYS=365

# Performance Settings
VITE_MAX_CONCURRENT_USERS=500
VITE_MESSAGE_PAGINATION_LIMIT=50
VITE_CONVERSATION_PAGINATION_LIMIT=20
```

### Entitlements Configuration

Update entitlements configuration for messaging permissions:

```typescript
// src/lib/entitlements/constants.ts

export const PRIVILEGED_ENTITLEMENTS = [
  // ... existing entitlements
  'CAN_INITIATE_DIRECT_MESSAGES', // New for Privileged tier
  ...MEMBER_ENTITLEMENTS
];

export const PRIVILEGED_PLUS_ENTITLEMENTS = [
  // ... existing entitlements
  'CAN_SEND_DIRECT_MESSAGES', // Existing for Privileged Plus
  ...PRIVILEGED_ENTITLEMENTS
];
```

## Frontend Deployment Steps

### 1. Install Dependencies

```bash
# Install any new dependencies
npm install date-fns
npm install @tanstack/react-query
# Other dependencies should already be installed
```

### 2. Add Messaging Components

Copy all messaging components to the appropriate directories:

```bash
# Create messaging directory structure
mkdir -p src/components/messaging/{pages,components,hooks,utils}

# Copy component files (as specified in frontend_implementation.md)
# - ConversationListPage.tsx
# - MessageThreadPage.tsx  
# - NewConversationPage.tsx
# - ConversationItem.tsx
# - MessageItem.tsx
# - MessageInput.tsx
# - MessagingHeader.tsx
# - useMessaging.ts
# - useRealtimeMessages.ts
```

### 3. Add API Functions

```bash
# Create messaging API directory
mkdir -p src/lib/api/messaging

# Copy API files (as specified in api_specification.md)
# - index.ts
# - core.ts
# - types.ts
# - permissions.ts
# - utils.ts
```

### 4. Update Routing

Modify `src/App.tsx` to include messaging routes:

```typescript
// Add messaging route imports
import { ConversationListPage } from '@/components/messaging/pages/ConversationListPage';
import { MessageThreadPage } from '@/components/messaging/pages/MessageThreadPage';
import { NewConversationPage } from '@/components/messaging/pages/NewConversationPage';

// Add routes under Layout
<Route path="/messages" element={<ConversationListPage />} />
<Route path="/messages/new" element={<NewConversationPage />} />
<Route path="/messages/:conversationId" element={<MessageThreadPage />} />
```

### 5. Integrate with Profile System

Update existing profile components to include messaging functionality:

```typescript
// src/components/profile/ProfileHeader.tsx
// Add messaging button (see frontend_implementation.md)

// src/pages/BookClubProfilePage.tsx  
// Add "Message User" button (see frontend_implementation.md)
```

## Build and Deployment

### Development Build

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test messaging functionality
# - Create test conversations
# - Send test messages
# - Verify real-time updates
```

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to hosting platform
# (Vercel, Netlify, or custom hosting)
```

### Deployment Verification

1. **Database Connectivity**
   - Verify Supabase connection
   - Test RLS policies with different user roles
   - Confirm store boundary enforcement

2. **Messaging Functionality**
   - Test conversation creation
   - Verify message sending/receiving
   - Confirm real-time updates
   - Test permission enforcement

3. **Performance Testing**
   - Load test with multiple concurrent users
   - Verify message pagination
   - Test real-time subscription limits

## Post-Deployment Configuration

### Supabase Realtime Settings

Configure Supabase Realtime for optimal performance:

```sql
-- Enable realtime for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
```

### Database Maintenance

Set up automated maintenance tasks:

```sql
-- Schedule message cleanup (run daily)
SELECT cron.schedule(
  'cleanup-expired-messages',
  '0 2 * * *', -- Run at 2 AM daily
  'SELECT cleanup_expired_messages();'
);

-- Schedule soft delete expired messages (run daily)
SELECT cron.schedule(
  'soft-delete-expired-messages', 
  '0 1 * * *', -- Run at 1 AM daily
  'SELECT soft_delete_expired_messages();'
);
```

### Monitoring Setup

Configure monitoring for messaging system:

1. **Database Performance**
   - Query performance monitoring
   - Connection pool monitoring
   - Storage usage tracking

2. **Real-time Performance**
   - Subscription count monitoring
   - Message delivery latency
   - Connection stability

3. **User Activity**
   - Active conversation tracking
   - Message volume monitoring
   - Error rate tracking

## Implementation Timeline

### Week 1: Database Foundation
- **Day 1-2**: Run database migrations
- **Day 3-4**: Test RLS policies and permissions
- **Day 5**: Validate database performance

### Week 2: API Implementation
- **Day 1-2**: Deploy API functions
- **Day 3-4**: Test permission enforcement
- **Day 5**: Validate store boundary enforcement

### Week 3: Frontend Deployment
- **Day 1-2**: Deploy messaging components
- **Day 3-4**: Integrate with profile system
- **Day 5**: Test complete user flow

### Week 4: Testing and Optimization
- **Day 1-2**: Performance testing
- **Day 3-4**: User acceptance testing
- **Day 5**: Production deployment

## Rollback Procedures

### Database Rollback

```sql
-- Drop messaging tables (if needed)
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Remove functions and triggers
DROP FUNCTION IF EXISTS set_message_retention() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_messages() CASCADE;
```

### Frontend Rollback

```bash
# Remove messaging routes from App.tsx
# Remove messaging components directory
# Revert profile integration changes
# Rebuild and redeploy
```

## Support and Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review message retention cleanup
- **Monthly**: Analyze performance metrics
- **Quarterly**: Review and optimize database indexes

### Customer Support
- **Documentation**: Provide user guides for messaging features
- **Training**: Train store staff on messaging functionality
- **Monitoring**: Set up alerts for system issues

## Related Documents

- **[Architecture Overview](./architecture_overview.md)**: System design and architectural decisions
- **[Database Design](./database_design.md)**: Complete schema and migration details
- **[API Specification](./api_specification.md)**: Backend implementation details
- **[Frontend Implementation](./frontend_implementation.md)**: UI component specifications

## Success Criteria

### Technical Success
- ✅ All database migrations execute successfully
- ✅ RLS policies enforce proper data isolation
- ✅ Real-time messaging works for target user capacity
- ✅ Performance meets specified benchmarks

### Business Success
- ✅ Store customers can successfully use messaging features
- ✅ System scales to handle store's user base
- ✅ Deployment process is repeatable for new customers
- ✅ Monitoring and maintenance procedures are established
