# Entitlements System Extension - Core System Design

## Overview

This document defines the core design elements of the extended entitlements system, including the role hierarchy, database schema changes, and fundamental concepts.

## Complete Role Hierarchy

The system will support a comprehensive role hierarchy with the following roles:

### 1. Platform Owner
- Full access to all platform features
- Manage stores, clubs, and users across the entire platform
- Access to platform-wide analytics and reporting
- Ability to assign Store Owner roles

### 2. Store Owner
- Manage store settings, inventory, and branding
- Create and delete book clubs within their store
- Assign Store Manager roles
- Access store analytics and reporting
- Moderate all clubs within their store

### 3. Store Manager
- Manage store inventory and day-to-day operations
- Moderate clubs within their assigned store
- Access limited store analytics
- Cannot create new stores or assign roles

### 4. Club Lead
- Full management of their specific book club
- Appoint and remove club moderators
- Manage club members and settings
- Moderate club discussions
- Select current book for the club

### 5. Club Moderator
- Moderate club discussions and content
- Cannot change club settings or remove members
- Cannot appoint other moderators

### 6. Privileged+ Member
- Create unlimited book clubs
- Join unlimited book clubs
- Nominate books in any club
- Create discussion topics
- Access to premium features like direct messaging

### 7. Privileged Member
- Create up to 3 book clubs
- Join unlimited book clubs
- Nominate books in any club
- Create discussion topics

### 8. Normal Member
- Join up to 5 book clubs
- Participate in discussions
- Cannot create clubs or nominate books

## Database Schema Changes

### New Tables

#### Store Administrators Table
```sql
CREATE TABLE IF NOT EXISTS store_administrators (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'manager')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (store_id, user_id)
);
```

#### Role Activity Tracking
```sql
CREATE TABLE IF NOT EXISTS role_activity (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_type TEXT CHECK (role_type IN ('club_lead', 'club_moderator', 'store_owner', 'store_manager')),
    context_id UUID NOT NULL,
    last_active TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, role_type, context_id)
);
```

### Table Modifications

#### User Membership Tiers
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_tier TEXT
    CHECK (membership_tier IN ('MEMBER', 'PRIVILEGED', 'PRIVILEGED_PLUS'))
    DEFAULT 'MEMBER';
```

## Role Hierarchy Implementation

### Hierarchy Definition
```typescript
const ROLE_HIERARCHY = {
  // Platform level
  'PLATFORM_OWNER': ['PLATFORM_OWNER', 'STORE_OWNER', 'STORE_MANAGER', 'CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],

  // Store level
  'STORE_OWNER': ['STORE_OWNER', 'STORE_MANAGER', 'CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],
  'STORE_MANAGER': ['STORE_MANAGER', 'CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],

  // Club level
  'CLUB_LEAD': ['CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],
  'CLUB_MODERATOR': ['CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],

  // Membership tiers
  'PRIVILEGED_PLUS': ['PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],
  'PRIVILEGED': ['PRIVILEGED', 'MEMBER'],
  'MEMBER': ['MEMBER']
};
```

## Key Design Principles

### 1. Context-Aware Permissions
- Permissions are evaluated within specific contexts (platform, store, club)
- Higher-level contexts override lower-level contexts
- Context hierarchy: Platform > Store > Club

### 2. Role Inheritance
- Higher roles inherit permissions from lower roles
- Inheritance follows the defined hierarchy
- Prevents permission gaps and inconsistencies

### 3. Membership Tier System
- Base membership tiers determine general platform access
- Tiers can be upgraded through subscriptions or administrative action
- Tiers are independent of contextual roles

### 4. Contextual Role Assignment
- Users can have different roles in different contexts
- Store roles apply to all clubs within that store
- Club roles are specific to individual clubs

## Implementation Considerations

### Database Indexing
Ensure proper indexing on:
- `store_administrators(user_id, store_id)`
- `role_activity(user_id, role_type)`
- `users(membership_tier)`

### Performance Optimization
- Pre-compute flattened permissions for frequent checks
- Cache role assignments at the application level
- Use database views for complex permission queries

### Data Integrity
- Enforce referential integrity with foreign key constraints
- Use check constraints to validate role values
- Implement triggers for audit trails

## Next Steps

1. Review and approve the core design
2. Implement database schema changes
3. Create migration scripts for existing data
4. Implement the role hierarchy logic
5. Update permission checking functions

## Related Documents

- [Implementation Details](./entitlements_implementation.md)
- [Migration Strategy](./entitlements_migration.md)
- [Advanced Considerations](./entitlements_advanced.md)
- [Testing Strategy](./entitlements_testing.md)
