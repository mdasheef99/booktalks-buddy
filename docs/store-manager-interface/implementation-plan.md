# Store Manager Interface Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for the Store Manager Interface in BookTalks Buddy. The Store Manager Interface provides a dedicated administrative panel for users appointed as Store Managers, with store-scoped functionality and appropriate permissions.

## Architecture Decision

**Approach**: Separate `/store-manager/*` interface that mirrors the admin panel structure
**Rationale**:
- Familiar admin-like experience for Store Managers
- Same navigation patterns and page structures as admin panel
- Store-scoped data with limited permissions
- Clean separation of concerns while maintaining UI consistency

## Prerequisites

### Existing Implementation Status
- ✅ **Store Manager Appointment System**: Fully implemented at `/admin/store-management/managers`
- ✅ **Database Schema**: `store_administrators` table with proper constraints
- ✅ **Entitlements System**: Store Manager entitlements defined and integrated
- ✅ **Service Layer**: `storeManagerService.ts` for appointment/removal operations

### Key Reference Files
- `src/types/storeManagers.ts` - Store Manager type definitions and permissions
- `src/lib/entitlements/constants.ts` - STORE_MANAGER_ENTITLEMENTS definition
- `src/hooks/useStoreOwnerAccess.ts` - Template for Store Manager access hook
- `src/components/layouts/AdminLayout.tsx` - Template for Store Manager layout
- `src/components/routeguards/StoreOwnerRouteGuard.tsx` - Template for route guard

## Directory Structure

```
src/
├── components/
│   └── store-manager/                    # New Store Manager components
│       ├── layout/
│       │   └── StoreManagerLayout.tsx
│       ├── dashboard/
│       │   ├── StoreManagerDashboard.tsx
│       │   ├── StoreMetricsCard.tsx
│       │   ├── StoreActivityFeed.tsx
│       │   └── QuickActions.tsx
│       ├── users/
│       │   ├── StoreUsersList.tsx
│       │   ├── StoreUserCard.tsx
│       │   ├── StoreUserActions.tsx
│       │   └── StoreUserInvitation.tsx
│       ├── clubs/
│       │   ├── StoreClubsList.tsx
│       │   ├── StoreClubCard.tsx
│       │   ├── StoreClubManagement.tsx
│       │   └── ClubLeadershipAssignment.tsx
│       ├── moderation/
│       │   ├── StoreModerationDashboard.tsx
│       │   ├── StoreReportsList.tsx
│       │   ├── StoreModerationActions.tsx
│       │   └── StoreContentModeration.tsx
│       ├── analytics/
│       │   ├── StoreAnalyticsDashboard.tsx
│       │   ├── StoreMetricsCharts.tsx
│       │   ├── StorePerformanceCards.tsx
│       │   └── StoreGrowthAnalytics.tsx
│       └── events/
│           ├── StoreEventsList.tsx
│           ├── StoreEventCard.tsx
│           ├── StoreEventManagement.tsx
│           └── StoreEventCreation.tsx
├── pages/
│   └── store-manager/                    # New Store Manager pages
│       ├── StoreManagerDashboardPage.tsx
│       ├── StoreManagerUsersPage.tsx
│       ├── StoreManagerClubsPage.tsx
│       ├── StoreManagerModerationPage.tsx
│       ├── StoreManagerAnalyticsPage.tsx
│       └── StoreManagerEventsPage.tsx
├── hooks/
│   └── store-manager/                    # Store Manager specific hooks
│       ├── useStoreManagerAccess.ts
│       ├── useStoreUsers.ts
│       ├── useStoreClubs.ts
│       ├── useStoreAnalytics.ts
│       └── useStoreModeration.ts
├── services/
│   └── store-manager/                    # Store Manager specific services
│       ├── storeUserService.ts
│       ├── storeClubService.ts
│       ├── storeAnalyticsService.ts
│       └── storeModerationService.ts
└── components/routeguards/
    └── StoreManagerRouteGuard.tsx        # New route guard
```

## Admin Panel to Store Manager Interface Mapping

### Current Admin Navigation Structure (from AdminLayout.tsx)

**Global Admin Sections (Available to All Admins):**
1. **Dashboard** (`/admin/dashboard`) - Platform overview and metrics
2. **Analytics** (`/admin/analytics`) - Platform-wide analytics and reporting
3. **Clubs** (`/admin/clubs`) - All book clubs management
4. **Users** (`/admin/users`) - All users management and tier control
5. **Delete Requests** (`/admin/delete-requests`) - User deletion request management
6. **Moderation** (`/admin/moderation`) - Content moderation and reports
7. **Events** (`/admin/events`) - Platform events management (conditional on `CAN_MANAGE_EVENTS`)

**Store Owner Exclusive Sections (18+ sections):**
- Subscription Management, Landing Page, Carousel, Banners, Community, Quotes, Book Listings, Book Requests, Landing Analytics, Book Club Analytics, Store Managers, etc.

### Store Manager Interface Mapping

**✅ INCLUDED Sections (Based on STORE_MANAGER_ENTITLEMENTS):**

| Admin Section | Store Manager Section | Store Manager Route | Permissions Required | Data Scope |
|---------------|----------------------|---------------------|---------------------|------------|
| Dashboard | Dashboard | `/store-manager/dashboard` | General access | Store-scoped metrics |
| Analytics | Analytics | `/store-manager/analytics` | `CAN_VIEW_STORE_ANALYTICS` | Store-only analytics |
| Clubs | Clubs | `/store-manager/clubs` | `CAN_VIEW_ALL_CLUBS`, `CAN_MANAGE_ALL_CLUBS`, `CAN_ASSIGN_CLUB_LEADS` | Store clubs only |
| Users | Users | `/store-manager/users` | `CAN_VIEW_ALL_MEMBERS`, `CAN_INVITE_USERS`, `CAN_MANAGE_USER_TIERS`, `CAN_ISSUE_WARNINGS`, `CAN_BAN_MEMBERS` | Store members only |
| Moderation | Moderation | `/store-manager/moderation` | `CAN_MODERATE_CONTENT`, `CAN_ISSUE_WARNINGS`, `CAN_POST_ANNOUNCEMENTS` | Store content only |
| Events | Events | `/store-manager/events` | `CAN_MANAGE_EVENTS`, `CAN_MANAGE_STORE_EVENTS` | Store events only |

**❌ EXCLUDED Sections (No Store Manager Permissions):**
- **Delete Requests** - No specific entitlement, platform-wide functionality
- **All Store Owner Sections** - Store Managers lack `CAN_MANAGE_STORE`, `CAN_MANAGE_STORE_SETTINGS`, etc.

### Store Manager Permissions Reference

From `src/lib/entitlements/constants.ts`, Store Managers have these permissions:

**User Management (4 permissions):**
- `CAN_VIEW_ALL_MEMBERS` - View all store members and profiles
- `CAN_INVITE_USERS` - Invite new users to join the store
- `CAN_ISSUE_WARNINGS` - Issue warnings for policy violations
- `CAN_BAN_MEMBERS` - Ban members from the store
- `CAN_UNBAN_MEMBERS` - Remove bans and restore access
- `CAN_MANAGE_MEMBER_TIERS` - Manage user membership tiers
- `CAN_MANAGE_USER_TIERS` - Administrative user tier management

**Club Management (3 permissions):**
- `CAN_VIEW_ALL_CLUBS` - View all book clubs within the store
- `CAN_MANAGE_ALL_CLUBS` - Administrative access to all store clubs
- `CAN_ASSIGN_CLUB_LEADS` - Appoint and manage club leadership

**Content Moderation (2 permissions):**
- `CAN_MODERATE_CONTENT` - Moderate discussions and user content
- `CAN_POST_ANNOUNCEMENTS` - Create store-wide announcements

**Analytics & Events (3 permissions):**
- `CAN_VIEW_STORE_ANALYTICS` - Access store performance metrics
- `CAN_MANAGE_EVENTS` - Create, edit, and manage events
- `CAN_MANAGE_STORE_EVENTS` - Store-specific event management

## 1:1 Template-to-Component Mapping

### Visual and Functional Similarity Approach

**Design Philosophy**: Store Manager interface should provide a **familiar admin-like experience** with:
- ✅ **Same layout structure** as AdminLayout.tsx
- ✅ **Same navigation patterns** and component structures
- ✅ **Same page structures** and UI workflows
- ✅ **Different visual theme** (terracotta instead of brown) to distinguish roles
- ✅ **Store-scoped data** with appropriate permission filtering
- ✅ **Identical user experience** but limited to store context

### Exact Admin-to-Store Manager Mapping

| Admin Template | Store Manager Component | Route Mapping | Key Changes |
|----------------|------------------------|---------------|-------------|
| `AdminLayout.tsx` | `StoreManagerLayout.tsx` | N/A | Same structure, 6 nav items instead of 18+, terracotta theme |
| `AdminDashboardPage.tsx` | `StoreManagerDashboardPage.tsx` | `/admin/dashboard` → `/store-manager/dashboard` | Store-scoped metrics only |
| `AdminAnalyticsPage.tsx` | `StoreManagerAnalyticsPage.tsx` | `/admin/analytics` → `/store-manager/analytics` | Store analytics only |
| `AdminClubManagementPage.tsx` | `StoreManagerClubsPage.tsx` | `/admin/clubs` → `/store-manager/clubs` | Store clubs only, no create/delete |
| `AdminUserListPage.tsx` | `StoreManagerUsersPage.tsx` | `/admin/users` → `/store-manager/users` | Store members only |
| `AdminModerationPage.tsx`* | `StoreManagerModerationPage.tsx` | `/admin/moderation` → `/store-manager/moderation` | Store content only |
| `AdminEventsPage.tsx` | `StoreManagerEventsPage.tsx` | `/admin/events` → `/store-manager/events` | Store events only |

*Note: AdminModerationPage.tsx may not exist yet - use admin moderation components as templates

### Foundation Templates (Study These Files)
| Template File | New Store Manager Component | Purpose |
|---------------|----------------------------|---------|
| `src/components/layouts/AdminLayout.tsx` | `StoreManagerLayout.tsx` | Main layout with navigation (6 items vs 18+) |
| `src/hooks/useStoreOwnerAccess.ts` | `useStoreManagerAccess.ts` | Access control and store context detection |
| `src/components/routeguards/StoreOwnerRouteGuard.tsx` | `StoreManagerRouteGuard.tsx` | Route protection for Store Managers |

### Service Templates
| Template Service | New Store Manager Service | Purpose |
|------------------|---------------------------|---------|
| `src/lib/api/users/core.ts` | `storeUserService.ts` | Store-scoped user operations |
| `src/lib/api/bookclubs/core.ts` | `storeClubService.ts` | Store-scoped club operations |
| `src/services/analytics/adminStatsService.ts` | `storeAnalyticsService.ts` | Store-scoped analytics |

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Establish basic Store Manager interface structure

#### 1.1 Access Control Foundation
- **File**: `src/hooks/store-manager/useStoreManagerAccess.ts`
- **Primary Template**: `src/hooks/useStoreOwnerAccess.ts`

**Complete Template Analysis Required:**
- **Primary Template File**: `src/hooks/useStoreOwnerAccess.ts` (185 lines)
  - Interface: `StoreOwnerAccessResult` - adapt to `StoreManagerAccessResult`
  - Main hook: `useStoreOwnerAccess()` - adapt to `useStoreManagerAccess()`
  - Validation hook: `useStoreOwnerValidation()` - adapt to `useStoreManagerValidation()`
  - Entitlements hook: `useStoreOwnerEntitlements()` - adapt to `useStoreManagerEntitlements()`
- **Dependencies to Analyze**:
  - `@/contexts/AuthContext` - understand `useAuth` hook usage
  - `@/lib/supabase` - understand database connection patterns
  - Database schema: `store_administrators` table structure
  - Error handling patterns for PGRST116 (no rows) vs other errors

**Key Functionality to Replicate**:
- Store Manager role detection via `store_administrators` table (role = 'manager')
- Store context retrieval (storeId, storeName) with stores table join
- Loading states and error handling
- Refetch functionality for permission updates
- Store validation for specific store IDs

**Store Manager Specific Changes**:
- Change role filter from 'owner' to 'manager'
- Update error messages to reference "Store Manager" instead of "Store Owner"
- Map Store Manager entitlements from `STORE_MANAGER_ENTITLEMENTS`

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify hook correctly detects Store Manager role
- Test loading states and error handling
- Confirm store context is properly retrieved
- Validate entitlements mapping is accurate
- **Request verification before proceeding to next component**

#### 1.2 Route Guard Implementation
- **File**: `src/components/routeguards/StoreManagerRouteGuard.tsx`
- **Primary Template**: `src/components/routeguards/StoreOwnerRouteGuard.tsx`

**Complete Template Analysis Required:**
- **Primary Template File**: `src/components/routeguards/StoreOwnerRouteGuard.tsx` (131 lines)
  - Interface: `StoreOwnerRouteGuardProps` - adapt to `StoreManagerRouteGuardProps`
  - Main component: `StoreOwnerRouteGuard` - adapt to `StoreManagerRouteGuard`
  - Context: `StoreOwnerContext` - adapt to `StoreManagerContext`
  - Hook: `useStoreOwnerContext` - adapt to `useStoreManagerContext`
  - HOC: `withStoreOwnerAccess` - adapt to `withStoreManagerAccess`
- **Dependencies to Analyze**:
  - `react-router-dom` - `Navigate`, `useLocation` usage patterns
  - `@/contexts/AuthContext` - authentication state handling
  - `@/hooks/store-manager/useStoreManagerAccess` - newly created hook
  - `@/components/ui/LoadingSpinner` - loading state component
  - `@/components/ui/alert` - error display components
  - `lucide-react` - `ShieldX` icon usage

**Key Functionality to Replicate**:
- Authentication and permission validation flow
- Loading state display with appropriate messaging
- Error handling and user feedback
- Navigation redirects for unauthorized access
- Store context provision to child components

**Store Manager Specific Changes**:
- Use `useStoreManagerAccess` instead of `useStoreOwnerAccess`
- Update loading message to "Verifying Store Manager access..."
- Update error message to reference Store Manager permissions
- Provide Store Manager context to child components

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify route guard correctly validates Store Manager access
- Test loading and error states
- Confirm unauthorized users are properly redirected
- Validate context is provided to child components
- **Request verification before proceeding to next component**

#### 1.3 Layout Implementation (1:1 Admin Mirror)
- **File**: `src/components/store-manager/layout/StoreManagerLayout.tsx`
- **Primary Template**: `src/components/layouts/AdminLayout.tsx`

**Complete Template Analysis Required:**
- **Primary Template File**: `src/components/layouts/AdminLayout.tsx` (318 lines)
  - Navigation structure: Lines 47-133 (global admin sections)
  - Store Owner sections: Lines 134-283 (conditional rendering)
  - Footer/logout section: Lines 284-318
- **Dependencies to Analyze**:
  - `react-router-dom` - `Outlet`, `NavLink`, `useNavigate` usage
  - `lucide-react` - All icon imports (LayoutDashboard, BookOpen, Users, etc.)
  - `@/components/ui/button` - Button component styling
  - `@/contexts/AuthContext` - Authentication context usage
  - `@/lib/entitlements/hooks` - `useHasEntitlement` hook patterns
  - `@/hooks/store-manager/useStoreManagerAccess` - newly created hook
- **Styling Dependencies**:
  - Tailwind classes: `bg-bookconnect-brown` → `bg-bookconnect-terracotta`
  - Navigation active/inactive states
  - Responsive design patterns
  - Sidebar layout structure

**Key Functionality to Replicate**:
- Sidebar navigation with 6 Store Manager sections
- Active/inactive navigation state styling
- Store context display (store name)
- Logout functionality
- Responsive layout structure

**Store Manager Specific Changes**:
- **6 navigation items only**: Dashboard, Analytics, Clubs, Users, Moderation, Events
- **Terracotta theme**: `bg-bookconnect-terracotta` instead of `bg-bookconnect-brown`
- **Title**: "Store Manager Panel" instead of "Admin Panel"
- **Subtitle**: "{storeName} Management" instead of "BookConnect Management"
- **Routes**: `/store-manager/*` instead of `/admin/*`
- **Remove**: All Store Owner exclusive sections (18+ sections)

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify layout structure matches AdminLayout.tsx
- Test navigation functionality and active states
- Confirm terracotta theme is applied correctly
- Validate store context display
- Test responsive design
- **Request verification before proceeding to next component**

#### 1.4 Basic Dashboard
- **File**: `src/pages/store-manager/StoreManagerDashboardPage.tsx`
- **Primary Template**: `src/pages/admin/AdminDashboardPage.tsx`

**Complete Template Analysis Required:**
- **Primary Template File**: `src/pages/admin/AdminDashboardPage.tsx` (164 lines)
  - Component imports and dependencies
  - State management patterns
  - Data fetching and display logic
  - Navigation and action handlers
- **Dependencies to Analyze**:
  - `react-router-dom` - `useNavigate` usage
  - `@/components/ui/button` - Button components
  - `@/components/ui/badge` - Badge components
  - `lucide-react` - Icon usage patterns
  - Dashboard-specific components from `./dashboard` directory
  - `@/hooks/store-manager/useStoreManagerAccess` - store context

**Key Functionality to Replicate**:
- Dashboard overview with store-scoped metrics
- Quick action buttons for common tasks
- Navigation to other Store Manager sections
- Loading states and error handling

**Store Manager Specific Changes**:
- **Store-scoped metrics**: Only data from assigned store
- **Store Manager actions**: Limited to Store Manager permissions
- **Navigation**: Links to `/store-manager/*` routes
- **Context**: Use Store Manager store context

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify dashboard displays store-scoped data
- Test navigation to other Store Manager sections
- Confirm loading states work correctly
- Validate Store Manager context usage
- **Request verification before proceeding to next component**

#### 1.5 Routing Integration
- **File**: `src/App.tsx` (modifications)
- **Primary Template**: Existing `/admin/*` route structure in `src/App.tsx`

**Complete Template Analysis Required**:
- **Primary Template Section**: Lines 208-254 in `src/App.tsx` (admin routes)
- **Dependencies to Analyze**:
  - Route structure patterns
  - Route guard integration
  - Layout component usage
  - Nested routing patterns

**Key Functionality to Replicate**:
- `/store-manager/*` route structure
- StoreManagerRouteGuard integration
- StoreManagerLayout usage
- Nested route definitions

**Store Manager Specific Changes**:
- **New route section**: `/store-manager/*` routes
- **Route guard**: `StoreManagerRouteGuard` instead of `GlobalAdminRouteGuard`
- **Layout**: `StoreManagerLayout` instead of `AdminLayout`
- **6 routes**: dashboard, users, clubs, moderation, analytics, events

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify all Store Manager routes are accessible
- Test route guard protection
- Confirm layout renders correctly
- Validate navigation between routes
- **Request verification before proceeding to Phase 2**

### Phase 2: Core Features (Week 2)
**Goal**: Implement primary Store Manager functionality

#### 2.1 Store Users Management
- **File**: `src/pages/store-manager/StoreManagerUsersPage.tsx`
- **Primary Template**: `src/pages/admin/AdminUserListPage.tsx`

**Complete Template Analysis Required:**
- **Primary Template File**: `src/pages/admin/AdminUserListPage.tsx` (312 lines)
  - State management: users list, loading, search, filters
  - Data fetching: supabase queries for users
  - Search functionality: username, email filtering
  - User actions: tier management, warnings, bans
  - Pagination and sorting logic
- **Dependencies to Analyze**:
  - `@/lib/supabase` - database query patterns
  - `@/components/ui/input` - search input components
  - `@/components/ui/select` - filter dropdown components
  - `@/components/ui/button` - action buttons
  - `@/components/ui/badge` - status badges
  - `@/components/ui/table` - user list display
  - `@/components/ui/dialog` - user action modals
  - `@/hooks/store-manager/useStoreManagerAccess` - store context
- **Related Service Files**:
  - `src/lib/api/users/core.ts` - user CRUD operations
  - `src/services/userManagement/userService.ts` - user management logic

**Key Functionality to Replicate**:
- User list display with search and filtering
- User tier management (Basic, Premium, VIP)
- Warning and ban management
- User invitation functionality
- Pagination and sorting

**Store Manager Specific Changes**:
- **Store-scoped queries**: Only users who are members of clubs in the store
- **Store context filtering**: Filter all operations by storeId
- **Remove global features**: No platform-wide user management
- **Store-specific actions**: All user actions scoped to store context

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify user list shows only store members
- Test search and filtering with store scope
- Confirm user actions work with store context
- Validate pagination and sorting
- **Request verification before proceeding to next component**

#### 2.2 Store Clubs Management
- **File**: `src/pages/store-manager/StoreManagerClubsPage.tsx`
- **Primary Template**: `src/pages/admin/AdminClubManagementPage.tsx`

**Complete Template Analysis Required:**
- **Primary Template File**: `src/pages/admin/AdminClubManagementPage.tsx` (287 lines)
  - State management: clubs list, loading, search, filters
  - Data fetching: supabase queries for clubs with store scoping
  - Search functionality: club name, description filtering
  - Club actions: member management, leadership assignment
  - Club status management: active/inactive states
- **Dependencies to Analyze**:
  - `@/lib/supabase` - database query patterns
  - `@/hooks/useStoreOwnerAccess` - store context (adapt to Store Manager)
  - `@/components/ui/input` - search input components
  - `@/components/ui/select` - filter dropdown components
  - `@/components/ui/button` - action buttons
  - `@/components/ui/badge` - status badges
  - `@/components/ui/card` - club card display
  - `@/components/ui/dialog` - club management modals
- **Related Service Files**:
  - `src/lib/api/bookclubs/core.ts` - club CRUD operations
  - `src/services/clubManagement/clubService.ts` - club management logic

**Key Functionality to Replicate**:
- Club list display with search and filtering
- Club member management
- Club leadership assignment
- Club status management
- Club moderation tools

**Store Manager Specific Changes**:
- **Store-scoped queries**: Only clubs within the assigned store
- **Remove create/delete**: Store Managers cannot create or delete clubs
- **Leadership assignment**: Assign club leads within store scope
- **Store context**: All operations filtered by storeId

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify club list shows only store clubs
- Test search and filtering with store scope
- Confirm club management actions work correctly
- Validate leadership assignment functionality
- **Request verification before proceeding to next component**

#### 2.3 Store-Scoped Services
- **Files**:
  - `src/services/store-manager/storeUserService.ts`
  - `src/services/store-manager/storeClubService.ts`

**Complete Template Analysis Required:**
- **Primary Template Files**:
  - `src/lib/api/users/core.ts` - user CRUD operations template
  - `src/lib/api/bookclubs/core.ts` - club CRUD operations template
  - `src/services/userManagement/userService.ts` - user management logic
  - `src/services/clubManagement/clubService.ts` - club management logic
- **Dependencies to Analyze**:
  - `@/lib/supabase` - database connection and query patterns
  - `@/types/database` - database type definitions
  - Error handling patterns and validation logic
  - Store context integration patterns

**Key Functionality to Replicate**:
- Store-scoped user queries and operations
- Store-scoped club queries and operations
- Error handling and validation
- Type-safe database operations

**Store Manager Specific Changes**:
- **Automatic store scoping**: All queries filtered by storeId
- **Store context validation**: Ensure operations are within store scope
- **Permission validation**: Check Store Manager entitlements

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify all service operations are store-scoped
- Test error handling and validation
- Confirm type safety and database operations
- **Request verification before proceeding to Phase 3**

### Phase 3: Advanced Features (Week 3)
**Goal**: Complete Store Manager feature set

#### 3.1 Store Moderation
- **File**: `src/pages/store-manager/StoreManagerModerationPage.tsx`
- **Primary Template**: Admin moderation components (analyze existing moderation features)

**Complete Template Analysis Required:**
- **Template Files to Analyze**:
  - Search for existing moderation components in `src/components/admin/`
  - `src/pages/admin/` - look for moderation-related pages
  - `src/services/moderation/` - moderation service files
  - `src/lib/api/moderation/` - moderation API operations
- **Dependencies to Analyze**:
  - Report management components and logic
  - Warning system implementation
  - Ban/unban functionality
  - Announcement creation features
  - Content moderation tools

**Key Functionality to Replicate**:
- Store-scoped content moderation
- Report management for store content
- Warning and ban management
- Announcement creation
- Content review and approval workflows

**Store Manager Specific Changes**:
- **Store-scoped moderation**: Only content from assigned store
- **Store context**: All moderation actions within store scope
- **Permission validation**: Check Store Manager moderation entitlements

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify moderation features are store-scoped
- Test report management functionality
- Confirm warning and ban systems work correctly
- **Request verification before proceeding to next component**

#### 3.2 Store Analytics
- **File**: `src/pages/store-manager/StoreManagerAnalyticsPage.tsx`
- **Primary Template**: `src/pages/admin/AdminAnalyticsPage.tsx`

**Complete Template Analysis Required:**
- **Primary Template File**: `src/pages/admin/AdminAnalyticsPage.tsx` (analyze full structure)
  - Analytics dashboard layout and components
  - Chart and graph implementations
  - Data fetching and processing logic
  - Time range filtering and controls
- **Dependencies to Analyze**:
  - `src/services/analytics/adminStatsService.ts` - analytics service template
  - Chart libraries (recharts, chart.js, etc.)
  - Date/time handling utilities
  - Analytics data processing functions
  - `@/hooks/store-manager/useStoreManagerAccess` - store context

**Key Functionality to Replicate**:
- Store-specific metrics and KPIs
- User growth analytics within store
- Club performance analytics
- Event attendance metrics
- Time-based analytics with filtering

**Store Manager Specific Changes**:
- **Store-scoped analytics**: Only data from assigned store
- **Store-specific KPIs**: Metrics relevant to store performance
- **Store context**: All analytics filtered by storeId

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify analytics show only store-scoped data
- Test chart rendering and data visualization
- Confirm time range filtering works correctly
- **Request verification before proceeding to next component**

#### 3.3 Store Events Management
- **File**: `src/pages/store-manager/StoreManagerEventsPage.tsx`
- **Primary Template**: `src/pages/admin/AdminEventsPage.tsx` (if exists) or event-related components

**Complete Template Analysis Required:**
- **Template Files to Analyze**:
  - Search for existing event management components
  - `src/pages/admin/` - look for event-related pages
  - `src/services/events/` - event service files
  - `src/lib/api/events/` - event API operations
  - `src/components/events/` - event UI components
- **Dependencies to Analyze**:
  - Event creation and editing forms
  - Event calendar components
  - Event attendance tracking
  - Event management workflows
  - Date/time handling for events

**Key Functionality to Replicate**:
- Store-scoped event management
- Event creation and editing
- Event attendance tracking
- Store calendar view
- Event moderation and management

**Store Manager Specific Changes**:
- **Store-scoped events**: Only events within assigned store
- **Store context**: All event operations filtered by storeId
- **Permission validation**: Check Store Manager event entitlements

**Implementation Validation Checkpoint**: ⚠️ **STOP AFTER COMPLETION**
- Verify event management is store-scoped
- Test event creation and editing functionality
- Confirm attendance tracking works correctly
- **Request verification before proceeding to Phase 4**

### Phase 4: Polish & Testing (Week 4)
**Goal**: Finalize and validate Store Manager interface

#### 4.1 UI/UX Refinements
- Store Manager specific styling and branding
- Responsive design optimization
- Loading states and error handling
- User experience improvements

#### 4.2 Integration Testing
- End-to-end Store Manager workflows
- Permission validation testing
- Store scoping verification
- Cross-browser compatibility

#### 4.3 Documentation
- Store Manager user guide
- Technical documentation updates
- API documentation for new services

## Complete Template File Reference Summary

### Critical Template Files for Analysis

**Foundation Components:**
1. **`src/hooks/useStoreOwnerAccess.ts`** (185 lines)
   - Store access detection and validation patterns
   - Database query structure for `store_administrators` table
   - Error handling for PGRST116 and other database errors
   - Store context retrieval with stores table joins

2. **`src/components/routeguards/StoreOwnerRouteGuard.tsx`** (131 lines)
   - Route protection and authentication flow
   - Loading state management and user feedback
   - Context provision to child components
   - Navigation redirect patterns

3. **`src/components/layouts/AdminLayout.tsx`** (318 lines)
   - Sidebar navigation structure and styling
   - Conditional rendering patterns for different admin roles
   - Active/inactive navigation state management
   - Responsive layout and theme implementation

**Core Feature Templates:**
4. **`src/pages/admin/AdminUserListPage.tsx`** (312 lines)
   - User list display with search and filtering
   - User management actions (warnings, bans, tier management)
   - Pagination and sorting implementation
   - Modal dialogs for user actions

5. **`src/pages/admin/AdminClubManagementPage.tsx`** (287 lines)
   - Club list display with store scoping
   - Club management and moderation tools
   - Leadership assignment functionality
   - Club status management

6. **`src/pages/admin/AdminDashboardPage.tsx`** (164 lines)
   - Dashboard layout and metrics display
   - Quick action buttons and navigation
   - Data fetching and loading states
   - Admin-specific dashboard components

7. **`src/pages/admin/AdminAnalyticsPage.tsx`** (analyze for structure)
   - Analytics dashboard implementation
   - Chart and graph rendering
   - Time range filtering and controls
   - Data processing and visualization

**Service Layer Templates:**
8. **`src/lib/api/users/core.ts`** - User CRUD operations and database queries
9. **`src/lib/api/bookclubs/core.ts`** - Club CRUD operations and database queries
10. **`src/services/userManagement/userService.ts`** - User management business logic
11. **`src/services/clubManagement/clubService.ts`** - Club management business logic
12. **`src/services/analytics/adminStatsService.ts`** - Analytics data processing

**Supporting Dependencies:**
13. **`src/contexts/AuthContext.tsx`** - Authentication context patterns
14. **`src/lib/supabase.ts`** - Database connection and query patterns
15. **`src/lib/entitlements/constants.ts`** - Store Manager entitlements definition
16. **`src/lib/entitlements/hooks.ts`** - Permission checking patterns
17. **`src/types/database.ts`** - Database type definitions
18. **`src/types/storeManagers.ts`** - Store Manager type definitions

### Implementation Validation Requirements

**Before Starting Each Component:**
1. **Read and analyze ALL template files** listed for that component
2. **Document key functionality** that needs to be replicated
3. **Identify dependencies** and their usage patterns
4. **Note Store Manager specific changes** required
5. **Plan store-scoping implementation** for data queries

**After Completing Each Component:**
1. **Test functionality** matches template behavior
2. **Verify store scoping** works correctly
3. **Confirm permission checking** is implemented
4. **Validate error handling** and loading states
5. **Request verification** before proceeding to next component

**Critical Success Factors:**
- ✅ **Complete template analysis** before implementation
- ✅ **Store-scoped data queries** for all operations
- ✅ **Permission validation** using Store Manager entitlements
- ✅ **Error handling** consistent with existing patterns
- ✅ **UI/UX consistency** with admin panel design
- ✅ **Validation checkpoints** at each major milestone

## Store Scoping Implementation

### Database Query Pattern
All Store Manager queries must be scoped to the store context:

```typescript
// Example: Get store users
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
```

### Context Provider Pattern
```typescript
// Store Manager context for all components
interface StoreManagerContextType {
  storeId: string;
  storeName: string;
  permissions: string[];
  isStoreManager: boolean;
}
```

## Next Steps

1. **Review Template Files**: Study all referenced template files to understand patterns
2. **Begin Phase 1**: Start with foundation components (access hook, route guard, layout)
3. **Iterative Development**: Complete each phase before moving to the next
4. **Continuous Testing**: Test each component as it's implemented
5. **Documentation Updates**: Update progress tracking document regularly

## Enhanced Implementation Approach

### Documentation Enhancements Applied

**1. Complete Template File References**: Every Store Manager component now includes detailed references to ALL corresponding admin panel template files, including main templates, dependencies, service files, hooks, UI components, and database patterns.

**2. Comprehensive Context Gathering**: Each implementation section documents ALL related files that need to be analyzed, including primary templates, secondary dependencies, database schema references, type definitions, styling files, and configuration utilities.

**3. Implementation Validation Checkpoints**: Explicit instructions require stopping after each major component completion, asking for implementation accuracy verification, confirming functionality works correctly, and validating template analysis was thorough.

**4. Template Analysis Requirements**: For each admin panel template file, documentation includes key functionality to replicate, components and dependencies to include, features to remove/modify for Store Manager scope, store-scoping requirements, and permission validation needs.

### Implementation Success Criteria

**Before Starting Implementation**:
- ✅ **Read ALL template files** listed for each component
- ✅ **Understand existing patterns** and dependencies
- ✅ **Plan store-scoping approach** for data queries
- ✅ **Identify Store Manager specific changes** required

**During Implementation**:
- ✅ **Follow template patterns** exactly where applicable
- ✅ **Apply store-scoping** to all database queries
- ✅ **Implement permission checking** using Store Manager entitlements
- ✅ **Maintain UI/UX consistency** with admin panel design

**After Each Component**:
- ✅ **Test functionality** matches template behavior
- ✅ **Verify store scoping** works correctly
- ✅ **Confirm error handling** and loading states
- ✅ **Request verification** before proceeding

This enhanced documentation ensures error-free implementation by providing complete context about all template files, dependencies, and requirements, with built-in validation checkpoints to ensure accuracy at each step.

## Cross-References

- **Progress Tracking**: `docs/store-manager-interface/progress-tracking.md`
- **Admin-to-Store Manager Mapping**: `docs/store-manager-interface/admin-to-store-manager-mapping.md`
- **Store Manager Appointment**: `src/pages/admin/store/StoreManagersManagement.tsx`
- **Entitlements System**: `src/lib/entitlements/constants.ts`
- **Type Definitions**: `src/types/storeManagers.ts`
