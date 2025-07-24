# Admin Panel to Store Manager Interface - Exact Mapping

## Overview

This document provides the exact 1:1 mapping between the existing Admin Panel structure and the new Store Manager Interface. The Store Manager Interface mirrors the admin panel structure but is limited to store-scoped data and Store Manager permissions.

## Current Admin Panel Structure Analysis

### From `src/components/layouts/AdminLayout.tsx`:

**Global Admin Sections (Available to All Admins):**
1. **Dashboard** (`/admin/dashboard`) - Platform overview and metrics
2. **Analytics** (`/admin/analytics`) - Platform-wide analytics and reporting  
3. **Clubs** (`/admin/clubs`) - All book clubs management
4. **Users** (`/admin/users`) - All users management and tier control
5. **Delete Requests** (`/admin/delete-requests`) - User deletion request management
6. **Moderation** (`/admin/moderation`) - Content moderation and reports
7. **Events** (`/admin/events`) - Platform events management (conditional on `CAN_MANAGE_EVENTS`)

**Store Owner Exclusive Sections (18+ sections):**
- Subscription Management (`/admin/subscriptions`)
- Landing Page (`/admin/store-management`)
- Carousel (`/admin/store-management/carousel`)
- Banners (`/admin/store-management/banners`)
- Community (`/admin/store-management/community`)
- Quotes (`/admin/store-management/quotes`)
- Book Listings (`/admin/store-management/book-listings`)
- Book Requests (`/admin/store-management/book-availability-requests`)
- Landing Analytics (`/admin/store-management/analytics`)
- Book Club Analytics (`/admin/store-management/book-club-analytics`)
- Store Managers (`/admin/store-management/managers`)
- *...and more*

## Store Manager Interface Structure

### Navigation Sections (6 sections vs 18+ for Store Owners)

```
Store Manager Panel
├── 📊 Dashboard
├── 📈 Analytics  
├── 📚 Clubs
├── 👥 Users
├── 🛡️ Moderation
└── 📅 Events
```

## Exact 1:1 Mapping Table

| # | Admin Section | Store Manager Section | Admin Route | Store Manager Route | Template File | New File | Permissions Required | Key Changes |
|---|---------------|----------------------|-------------|---------------------|---------------|----------|---------------------|-------------|
| 1 | Dashboard | Dashboard | `/admin/dashboard` | `/store-manager/dashboard` | `AdminDashboardPage.tsx` | `StoreManagerDashboardPage.tsx` | General access | Store-scoped metrics only |
| 2 | Analytics | Analytics | `/admin/analytics` | `/store-manager/analytics` | `AdminAnalyticsPage.tsx` | `StoreManagerAnalyticsPage.tsx` | `CAN_VIEW_STORE_ANALYTICS` | Store analytics only, no platform data |
| 3 | Clubs | Clubs | `/admin/clubs` | `/store-manager/clubs` | `AdminClubManagementPage.tsx` | `StoreManagerClubsPage.tsx` | `CAN_VIEW_ALL_CLUBS`, `CAN_MANAGE_ALL_CLUBS`, `CAN_ASSIGN_CLUB_LEADS` | Store clubs only, no create/delete |
| 4 | Users | Users | `/admin/users` | `/store-manager/users` | `AdminUserListPage.tsx` | `StoreManagerUsersPage.tsx` | `CAN_VIEW_ALL_MEMBERS`, `CAN_INVITE_USERS`, `CAN_MANAGE_USER_TIERS`, `CAN_ISSUE_WARNINGS`, `CAN_BAN_MEMBERS` | Store members only, no global access |
| 5 | Moderation | Moderation | `/admin/moderation` | `/store-manager/moderation` | `AdminModerationPage.tsx`* | `StoreManagerModerationPage.tsx` | `CAN_MODERATE_CONTENT`, `CAN_ISSUE_WARNINGS`, `CAN_POST_ANNOUNCEMENTS` | Store content only, no platform moderation |
| 6 | Events | Events | `/admin/events` | `/store-manager/events` | `AdminEventsPage.tsx` | `StoreManagerEventsPage.tsx` | `CAN_MANAGE_EVENTS`, `CAN_MANAGE_STORE_EVENTS` | Store events only, no platform events |

*Note: AdminModerationPage.tsx may not exist yet - use existing admin moderation components as templates

## Excluded Admin Sections

### ❌ Not Included in Store Manager Interface

| Admin Section | Reason for Exclusion | Missing Permission |
|---------------|---------------------|-------------------|
| Delete Requests | No specific Store Manager entitlement | Platform-wide functionality |
| All Store Owner Sections | Store Managers lack store management permissions | `CAN_MANAGE_STORE`, `CAN_MANAGE_STORE_SETTINGS`, `CAN_MANAGE_STORE_BILLING`, etc. |

## Layout Implementation Details

### StoreManagerLayout.tsx Requirements

**Based on `src/components/layouts/AdminLayout.tsx`:**

```typescript
// Same structure as AdminLayout.tsx but with:
const storeManagerNavigation = [
  {
    path: '/store-manager/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    path: '/store-manager/analytics',
    label: 'Analytics',
    icon: BarChart,
    permission: 'CAN_VIEW_STORE_ANALYTICS'
  },
  {
    path: '/store-manager/clubs',
    label: 'Clubs',
    icon: BookOpen,
    permission: 'CAN_VIEW_ALL_CLUBS'
  },
  {
    path: '/store-manager/users',
    label: 'Users',
    icon: Users,
    permission: 'CAN_VIEW_ALL_MEMBERS'
  },
  {
    path: '/store-manager/moderation',
    label: 'Moderation',
    icon: Shield,
    permission: 'CAN_MODERATE_CONTENT'
  },
  {
    path: '/store-manager/events',
    label: 'Events',
    icon: Calendar,
    permission: 'CAN_MANAGE_EVENTS'
  }
];
```

### Visual Theme Changes

```typescript
// AdminLayout.tsx uses:
className="w-64 bg-bookconnect-brown text-white p-6 flex flex-col"

// StoreManagerLayout.tsx should use:
className="w-64 bg-bookconnect-terracotta text-white p-6 flex flex-col"

// Header changes:
<h1 className="text-2xl font-serif font-bold">Store Manager Panel</h1>
<p className="text-sm opacity-70">{storeName} Management</p>
```

## Store Scoping Implementation

### Database Query Pattern

All Store Manager queries must filter by store context:

```typescript
// Example: Store-scoped users query
const getStoreUsers = async (storeId: string) => {
  const { data } = await supabase
    .from('club_members')
    .select(`
      user_id,
      users!inner (
        id, username, email, displayname,
        membership_tier, account_status
      )
    `)
    .in('club_id', 
      supabase.from('book_clubs')
        .select('id')
        .eq('store_id', storeId)
    );
  
  return data;
};

// Example: Store-scoped clubs query  
const getStoreClubs = async (storeId: string) => {
  const { data } = await supabase
    .from('book_clubs')
    .select('*')
    .eq('store_id', storeId);
    
  return data;
};
```

## Implementation Strategy

### Phase 1: Foundation
1. **StoreManagerLayout.tsx** - Copy AdminLayout.tsx, modify navigation and theme
2. **useStoreManagerAccess.ts** - Copy useStoreOwnerAccess.ts, modify for Store Manager detection
3. **StoreManagerRouteGuard.tsx** - Copy StoreOwnerRouteGuard.tsx, modify for Store Manager permissions

### Phase 2: Core Pages (1:1 Copies)
1. **StoreManagerDashboardPage.tsx** - Copy AdminDashboardPage.tsx, add store scoping
2. **StoreManagerUsersPage.tsx** - Copy AdminUserListPage.tsx, add store scoping
3. **StoreManagerClubsPage.tsx** - Copy AdminClubManagementPage.tsx, add store scoping

### Phase 3: Advanced Pages
1. **StoreManagerAnalyticsPage.tsx** - Copy AdminAnalyticsPage.tsx, add store scoping
2. **StoreManagerModerationPage.tsx** - Create based on admin moderation components
3. **StoreManagerEventsPage.tsx** - Copy AdminEventsPage.tsx, add store scoping

## Key Implementation Principles

1. **Mirror, Don't Reinvent**: Copy existing admin pages and modify for store scoping
2. **Same User Experience**: Maintain identical UI patterns and workflows
3. **Visual Distinction**: Use terracotta theme to distinguish from admin panel
4. **Permission-Based**: Show/hide features based on Store Manager entitlements
5. **Store Context**: All data queries automatically scoped to store
6. **Familiar Navigation**: Same navigation patterns as admin panel

## Success Criteria

✅ **Store Managers get familiar admin-like experience**  
✅ **Same navigation patterns and page structures**  
✅ **Store-scoped data with appropriate permissions**  
✅ **Visual distinction from Store Owner admin panel**  
✅ **No access to Store Owner exclusive features**  
✅ **Consistent UI/UX with existing admin interface**

---

**Next Steps**: Begin Phase 1 implementation with StoreManagerLayout.tsx using AdminLayout.tsx as the exact template.
