# Entitlements System Design

## Overview
This document outlines the design of the entitlements-based authorization system for the BookConnect application. The entitlements system will replace direct role checks with a more flexible and maintainable approach to authorization.

## Core Concepts

### Entitlements vs. Roles
- **Roles** define a user's position or title (Store Owner, Club Lead, etc.)
- **Entitlements** define what a user can do (create a club, manage users, etc.)
- A user's entitlements are derived from their roles, but the authorization system checks entitlements, not roles

### Entitlement Types
1. **General Entitlements**: Apply globally across the application
2. **Contextual Entitlements**: Apply to specific resources (clubs, stores)
3. **Tier-Based Entitlements**: Derived from a user's account tier

## Entitlements List

### Basic Entitlements (All Users)
- `CAN_VIEW_PUBLIC_CLUBS` - Can view clubs with 'free' access tier
- `CAN_JOIN_PUBLIC_CLUBS` - Can join or request to join public clubs
- `CAN_PARTICIPATE_IN_DISCUSSIONS` - Can post in discussions in joined clubs
- `CAN_EDIT_OWN_PROFILE` - Can edit own profile information
- `CAN_VIEW_STORE_EVENTS` - Can view general store events

### Privileged Member Entitlements
- `CAN_ACCESS_PREMIUM_CONTENT` - Can access premium content
- `CAN_JOIN_PREMIUM_CLUBS` - Can join clubs with 'all_premium' access tier
- `CAN_ACCESS_PREMIUM_EVENTS` - Can access premium events

### Privileged Plus Member Entitlements
- `CAN_CREATE_UNLIMITED_CLUBS` - Can create unlimited book clubs
- `CAN_JOIN_EXCLUSIVE_CLUBS` - Can join clubs with 'privileged_plus' access tier
- `CAN_ACCESS_EXCLUSIVE_CONTENT` - Can access exclusive content sections

### Club Lead Entitlements
- `CAN_MANAGE_CLUB_SETTINGS` - Can edit club details
- `CAN_DELETE_OWN_CLUB` - Can delete clubs they lead
- `CAN_SET_CLUB_CURRENT_BOOK` - Can set the current book for a club
- `CAN_MANAGE_CLUB_JOIN_REQUESTS` - Can approve/deny join requests
- `CAN_REMOVE_CLUB_MEMBERS` - Can remove members from a club
- `CAN_ASSIGN_CLUB_MODERATORS` - Can assign moderators to their club

### Club Moderator Entitlements
- `CAN_DELETE_CLUB_POSTS` - Can delete posts in moderated clubs
- `CAN_LOCK_CLUB_TOPICS` - Can lock/unlock topics in moderated clubs
- `CAN_ISSUE_MEMBER_WARNINGS` - Can issue warnings to members

### Store Manager Entitlements
- `CAN_MANAGE_USER_TIERS` - Can update user account tiers
- `CAN_MANAGE_ALL_CLUBS` - Can manage all clubs in the store
- `CAN_MANAGE_STORE_EVENTS` - Can manage store-wide events
- `CAN_VIEW_STORE_ANALYTICS` - Can view store analytics
- `CAN_ASSIGN_CLUB_LEADS` - Can assign Club Lead role to users

### Store Owner Entitlements
- `CAN_MANAGE_STORE_MANAGERS` - Can assign/revoke Store Manager role
- `CAN_MANAGE_STORE_SETTINGS` - Can manage store-wide settings
- `CAN_MANAGE_STORE_BILLING` - Can manage store billing information

### Contextual Entitlements
- `STORE_OWNER_{storeId}` - User is an owner of the specified store
- `STORE_MANAGER_{storeId}` - User is a manager of the specified store
- `CLUB_LEAD_{clubId}` - User is the lead of the specified club
- `CLUB_MODERATOR_{clubId}` - User is a moderator of the specified club

## Entitlements Calculation

### Calculation Process
1. Start with basic entitlements for all authenticated users
2. Add tier-based entitlements based on user's account_tier
3. Add store role entitlements based on store_administrators entries
4. Add club lead entitlements based on book_clubs.lead_user_id
5. Add club moderator entitlements based on club_moderators entries

### Example Calculation
```
function calculateUserEntitlements(userId) {
  const entitlements = [
    // Basic entitlements for all users
    'CAN_VIEW_PUBLIC_CLUBS',
    'CAN_JOIN_PUBLIC_CLUBS',
    'CAN_PARTICIPATE_IN_DISCUSSIONS',
    'CAN_EDIT_OWN_PROFILE',
    'CAN_VIEW_STORE_EVENTS'
  ];

  // Add tier-based entitlements
  const userTier = getUserTier(userId);
  if (userTier === 'privileged' || userTier === 'privileged_plus') {
    entitlements.push(
      'CAN_ACCESS_PREMIUM_CONTENT',
      'CAN_JOIN_PREMIUM_CLUBS',
      'CAN_ACCESS_PREMIUM_EVENTS'
    );
  }

  if (userTier === 'privileged_plus') {
    entitlements.push(
      'CAN_CREATE_CLUB',
      'CAN_JOIN_EXCLUSIVE_CLUBS',
      'CAN_ACCESS_EXCLUSIVE_CONTENT'
    );
  }

  // Add store role entitlements
  const storeRoles = getStoreRoles(userId);
  for (const role of storeRoles) {
    entitlements.push(`STORE_${role.role.toUpperCase()}_${role.storeId}`);

    if (role.role === 'manager') {
      entitlements.push(
        'CAN_MANAGE_USER_TIERS',
        'CAN_MANAGE_ALL_CLUBS',
        'CAN_MANAGE_STORE_EVENTS',
        'CAN_VIEW_STORE_ANALYTICS',
        'CAN_ASSIGN_CLUB_LEADS'
      );
    }

    if (role.role === 'owner') {
      entitlements.push(
        'CAN_MANAGE_USER_TIERS',
        'CAN_MANAGE_ALL_CLUBS',
        'CAN_MANAGE_STORE_EVENTS',
        'CAN_VIEW_STORE_ANALYTICS',
        'CAN_ASSIGN_CLUB_LEADS',
        'CAN_MANAGE_STORE_MANAGERS',
        'CAN_MANAGE_STORE_SETTINGS',
        'CAN_MANAGE_STORE_BILLING'
      );
    }
  }

  // Add club lead entitlements
  const ledClubs = getLedClubs(userId);
  for (const club of ledClubs) {
    entitlements.push(`CLUB_LEAD_${club.id}`);
    entitlements.push(
      'CAN_MANAGE_CLUB_SETTINGS',
      'CAN_DELETE_OWN_CLUB',
      'CAN_SET_CLUB_CURRENT_BOOK',
      'CAN_MANAGE_CLUB_JOIN_REQUESTS',
      'CAN_REMOVE_CLUB_MEMBERS',
      'CAN_ASSIGN_CLUB_MODERATORS'
    );
  }

  // Add club moderator entitlements
  const moderatedClubs = getModeratedClubs(userId);
  for (const club of moderatedClubs) {
    entitlements.push(`CLUB_MODERATOR_${club.id}`);
    entitlements.push(
      'CAN_DELETE_CLUB_POSTS',
      'CAN_LOCK_CLUB_TOPICS',
      'CAN_ISSUE_MEMBER_WARNINGS'
    );
  }

  return [...new Set(entitlements)]; // Remove duplicates
}
```

## Entitlements Caching

### Caching Strategy
- Calculate entitlements on login and store in AuthContext
- Cache in memory/session storage for quick access
- Set expiration time (e.g., 15 minutes) to ensure fresh data
- Provide method to force refresh when roles change

### Cache Invalidation Triggers
- User logs in/out
- User's account tier changes
- User is assigned/removed from a store role
- User becomes a club lead
- User is assigned/removed as a club moderator

## Entitlements Checking

### General Entitlement Check
```
function hasEntitlement(user, entitlement) {
  return user.entitlements.includes(entitlement);
}
```

### Contextual Entitlement Check
```
function hasContextualEntitlement(user, prefix, contextId) {
  return user.entitlements.includes(`${prefix}_${contextId}`);
}
```

### Complex Authorization Check
```
function canManageClub(user, clubId) {
  return (
    hasEntitlement(user, 'CAN_MANAGE_ALL_CLUBS') ||
    hasContextualEntitlement(user, 'CLUB_LEAD', clubId) ||
    hasContextualEntitlement(user, 'STORE_OWNER', getClubStoreId(clubId)) ||
    hasContextualEntitlement(user, 'STORE_MANAGER', getClubStoreId(clubId))
  );
}
```

## UI Integration

### Conditional Rendering
```
function AdminButton({ clubId }) {
  const { user } = useAuth();
  const canManage = useEntitlement(user, 'CAN_MANAGE_CLUB_SETTINGS') &&
                    (hasContextualEntitlement(user, 'CLUB_LEAD', clubId) ||
                     hasEntitlement(user, 'CAN_MANAGE_ALL_CLUBS'));

  if (!canManage) return null;

  return <Button>Manage Club</Button>;
}
```

### Navigation Filtering
```
const adminRoutes = [
  { path: '/admin/users', entitlement: 'CAN_MANAGE_USER_TIERS' },
  { path: '/admin/clubs', entitlement: 'CAN_MANAGE_ALL_CLUBS' },
  { path: '/admin/events', entitlement: 'CAN_MANAGE_STORE_EVENTS' },
  { path: '/admin/managers', entitlement: 'CAN_MANAGE_STORE_MANAGERS' },
  { path: '/admin/settings', entitlement: 'CAN_MANAGE_STORE_SETTINGS' },
  { path: '/admin/billing', entitlement: 'CAN_MANAGE_STORE_BILLING' }
];

function AdminNav() {
  const { user } = useAuth();

  return (
    <nav>
      {adminRoutes
        .filter(route => hasEntitlement(user, route.entitlement))
        .map(route => (
          <Link key={route.path} to={route.path}>
            {route.name}
          </Link>
        ))}
    </nav>
  );
}
```

## Implementation Notes

### Performance Considerations
- Cache entitlements to avoid recalculation on every request
- Use batch queries when calculating entitlements
- Consider denormalizing some role data for faster access

### Security Considerations
- Always perform entitlement checks on both client and server
- Use RLS policies as an additional security layer
- Log all entitlement changes for audit purposes

### Maintenance Considerations
- Keep entitlements list in a central location
- Document the purpose of each entitlement
- Consider creating entitlement groups for common combinations
