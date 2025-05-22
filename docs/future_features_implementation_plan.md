# Future Features Implementation Plan

This document outlines a comprehensive roadmap for implementing the remaining features in the BookConnect platform, organized by complexity and priority.

> **Note**: The Entitlements System Extension plan has been moved to a separate document: [entitlements_system_extension_plan.md](./entitlements_system_extension_plan.md)

## 1. Enhanced Moderation Tools

**Complexity: Medium | Priority: High**

Building on the entitlements system, implement comprehensive moderation tools for Club Leads and Moderators.

### Implementation Details

#### Database Schema Changes

```sql
-- User Warnings Table
CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    issued_by UUID REFERENCES auth.users(id),
    issued_at TIMESTAMPTZ DEFAULT now(),
    reason TEXT NOT NULL,
    scope TEXT CHECK (scope IN ('store', 'club')),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    CONSTRAINT valid_scope CHECK (
        (scope = 'store' AND store_id IS NOT NULL AND club_id IS NULL) OR
        (scope = 'club' AND club_id IS NOT NULL)
    )
);

-- Content Moderation Actions
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT CHECK (action_type IN ('delete', 'lock', 'warn', 'mute')),
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT now(),
    target_type TEXT CHECK (target_type IN ('post', 'topic', 'user')),
    target_id UUID NOT NULL,
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    reason TEXT,
    expires_at TIMESTAMPTZ
);
```

#### UI Components

1. **ModerationPanel Component**
   - Content filtering and search
   - Action buttons for delete, lock, warn
   - Confirmation dialogs
   - Audit log of previous actions

2. **UserWarningDialog Component**
   - Reason input
   - Expiration date selection
   - Severity level selection

#### API Functions

```typescript
// src/lib/api/moderation.ts
export async function issueWarning(moderatorId, userId, scope, contextId, reason, expiresAt) {
  // Permission check
  // Warning creation
  // Notification to user
}

export async function lockTopic(moderatorId, topicId, reason) {
  // Permission check
  // Topic locking
  // Moderation action recording
}
```

### Timeline: 3 Weeks

- Week 1: Database schema implementation and API functions
- Week 2: UI components for moderation actions
- Week 3: Integration, testing, and refinement

## 2. Direct Messaging System

**Complexity: High | Priority: Medium**

Implement a private messaging system with tier-based permissions.

### Implementation Details

#### Database Schema Changes

```sql
-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    title TEXT,
    is_group BOOLEAN DEFAULT false
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false
);
```

#### UI Components

1. **MessagesPage Component**
   - Conversation list
   - Message thread view
   - Composition area
   - User search for new conversations

2. **ConversationList Component**
   - Recent conversations
   - Unread indicators
   - Last message preview

3. **MessageThread Component**
   - Message display with sender info
   - Timestamp and read status
   - Message actions (edit, delete)

#### Permission Enforcement

```typescript
// src/lib/api/messaging.ts
export async function startConversation(initiatorId, recipientId) {
  // Check if initiator has permission to start conversations
  const entitlements = await getUserEntitlements(initiatorId);
  const canInitiateMessages = entitlements.includes('CAN_INITIATE_MESSAGES');

  if (!canInitiateMessages) {
    throw new Error('Unauthorized: Only Privileged and Privileged+ members can start conversations');
  }

  // Create conversation
  // Add participants
  // Return conversation details
}
```

### Timeline: 4 Weeks

- Week 1: Database schema implementation
- Week 2: Core messaging API functions
- Week 3: UI components for messaging
- Week 4: Permission enforcement, testing, and refinement

## 3. Reporting System

**Complexity: Medium | Priority: Medium**

Implement a comprehensive reporting system for inappropriate content and user behavior.

### Implementation Details

#### Database Schema Changes

```sql
-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_at TIMESTAMPTZ DEFAULT now(),
    content_type TEXT CHECK (content_type IN ('post', 'topic', 'user', 'club')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE
);
```

#### UI Components

1. **ReportButton Component**
   - Context-aware reporting
   - Reason selection
   - Additional details input

2. **ReportQueue Component**
   - Filterable list of reports
   - Status indicators
   - Action buttons for moderators

3. **ReportResolutionDialog Component**
   - Resolution status selection
   - Notes input
   - Action buttons (warn, ban, delete content)

#### API Functions

```typescript
// src/lib/api/reports.ts
export async function createReport(reporterId, contentType, contentId, reason, clubId) {
  // Validate inputs
  // Create report record
  // Notify appropriate moderators
}

export async function resolveReport(moderatorId, reportId, resolution, notes) {
  // Check moderator permissions
  // Update report status
  // Take any associated actions
  // Notify reporter of resolution
}
```

### Timeline: 3 Weeks

- Week 1: Database schema implementation and API functions
- Week 2: UI components for reporting and resolution
- Week 3: Integration, testing, and refinement

## 4. Store Management Features

**Complexity: Medium | Priority: Medium**

Enhance store management capabilities for Store Owners and Managers.

### Implementation Details

#### Database Schema Changes

```sql
-- Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE PRIMARY KEY,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store Invitations
CREATE TABLE IF NOT EXISTS store_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    token TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending'
);
```

#### UI Components

1. **StoreSettingsPanel Component**
   - Branding configuration
   - Default club settings
   - Membership tier pricing display

2. **UserInvitationPanel Component**
   - Email input
   - Role selection
   - Invitation tracking

3. **StoreAdminPanel Component**
   - Manager appointment
   - Permission configuration
   - Activity monitoring

#### API Functions

```typescript
// src/lib/api/store.ts
export async function updateStoreSettings(ownerId, storeId, settings) {
  // Permission check
  // Settings validation
  // Update store settings
}

export async function inviteUser(adminId, storeId, email, initialRole) {
  // Permission check
  // Generate invitation token
  // Send invitation email
  // Record invitation
}
```

### Timeline: 3 Weeks

- Week 1: Database schema implementation and API functions
- Week 2: UI components for store management
- Week 3: Integration, testing, and refinement

## 5. Analytics Capabilities

**Complexity: High | Priority: Low**

Implement comprehensive analytics for Store Owners and Club Leads.

### Implementation Details

#### Database Schema Changes

```sql
-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    occurred_at TIMESTAMPTZ DEFAULT now(),
    context_type TEXT CHECK (context_type IN ('store', 'club', 'book', 'discussion')),
    context_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Analytics Aggregates (Materialized View)
CREATE MATERIALIZED VIEW analytics_daily_aggregates AS
SELECT
    date_trunc('day', occurred_at) AS day,
    context_type,
    context_id,
    event_type,
    COUNT(*) AS event_count
FROM analytics_events
GROUP BY 1, 2, 3, 4;
```

#### UI Components

1. **StoreAnalyticsDashboard Component**
   - Member growth charts
   - Activity heatmaps
   - Club engagement metrics
   - Conversion analytics

2. **ClubAnalyticsDashboard Component**
   - Member participation metrics
   - Discussion activity trends
   - Book engagement statistics
   - Reading progress aggregates

#### API Functions

```typescript
// src/lib/api/analytics.ts
export async function getStoreAnalytics(ownerId, storeId, timeframe) {
  // Permission check
  // Query analytics data
  // Format for visualization
}

export async function getClubAnalytics(leadId, clubId, timeframe) {
  // Permission check
  // Query club-specific analytics
  // Format for visualization
}
```

### Timeline: 4 Weeks

- Week 1: Database schema implementation and event tracking
- Week 2: Data aggregation and API functions
- Week 3: UI components for analytics visualization
- Week 4: Dashboard integration, testing, and refinement

## 6. OCR Book Inventory

**Complexity: High | Priority: Low**

Implement OCR functionality for scanning and adding books to the inventory.

### Implementation Details

#### External Dependencies

- OCR service (Google Cloud Vision API or similar)
- Image processing library
- Book metadata API (Google Books API)

#### UI Components

1. **BookScannerComponent**
   - Camera access
   - Image upload
   - Scan results preview
   - Metadata confirmation

2. **BookMetadataEditor**
   - OCR result editing
   - Additional metadata input
   - Cover image selection

#### API Functions

```typescript
// src/lib/api/ocr.ts
export async function scanBookImage(userId, imageData) {
  // Upload image to storage
  // Call OCR service
  // Extract book information
  // Match with Google Books API
  // Return structured book data
}

export async function addScannedBook(userId, bookData) {
  // Validate book data
  // Save to books table
  // Associate with store inventory
  // Return book details
}
```

### Timeline: 5 Weeks

- Week 1: OCR service integration and image processing
- Week 2: Book metadata extraction and matching
- Week 3: UI components for scanning and confirmation
- Week 4: Database integration and inventory management
- Week 5: Testing, optimization, and refinement

## Implementation Priority Rationale

1. **Enhanced Moderation Tools**: Critical for community health and safety
2. **Direct Messaging System**: High user value, differentiates membership tiers
3. **Reporting System**: Important for community management and moderation
4. **Store Management Features**: Enhances platform administration capabilities
5. **Analytics Capabilities**: Provides business insights but less critical for core functionality
6. **OCR Book Inventory**: Innovative but complex feature with specialized dependencies

> **Note**: The Entitlements System Extension (highest priority) has been moved to its own document as it is foundational for other features and enables proper permission enforcement.

This prioritization balances:
- Technical dependencies (foundation first)
- User impact (community features before administrative tools)
- Implementation complexity (simpler features before complex ones)
- Business value (tier differentiation and community health)

Each feature builds upon the previous ones, creating a logical progression that minimizes rework and maximizes value delivery.
