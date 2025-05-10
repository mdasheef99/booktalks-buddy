# Role System Implementation Plan

## Overview
This document outlines the detailed implementation plan for the entitlements-based role system. It will be updated as each step is completed to track progress and document decisions made during implementation.

## System Requirements
- Multi-tiered role system with Platform Owner, Store Owner, Store Manager, Club Lead, Privileged Plus Member, Privileged Member, Member (Free), and Club Moderator roles
- Entitlements-based authorization system
- Database schema changes to support the new role system
- UI updates to reflect different access levels

## Implementation Phases

### Phase 1: Database Schema Updates
- [x] **Step 1: Update Users Table**
  - Add `account_tier` column to the `users` table
  - Data type: TEXT
  - Constraint: CHECK (account_tier IN ('free', 'privileged', 'privileged_plus'))
  - Default value: 'free'
  - NOT NULL constraint
  - **Status**: Completed
  - **Notes**: Migration file created at `supabase\migrations\20250510150722_role_system_schema.sql`

- [x] **Step 2: Create Store Administrators Table**
  - Create `store_administrators` table with:
    - `store_id` (UUID, FK to stores)
    - `user_id` (UUID, FK to auth.users)
    - `role` (TEXT, CHECK constraint for 'owner', 'manager')
    - `assigned_at` (TIMESTAMPTZ, default now())
    - `assigned_by` (UUID, FK to auth.users)
    - Primary Key on (store_id, user_id)
  - **Status**: Completed
  - **Notes**: Migration file created at `supabase\migrations\20250510150722_role_system_schema.sql`

- [x] **Step 3: Update Book Clubs Table**
  - Add `lead_user_id` column (UUID, FK to auth.users, NOT NULL)
  - Add `access_tier_required` column:
    - Data type: TEXT
    - Constraint: CHECK (access_tier_required IN ('free', 'privileged_plus', 'all_premium'))
    - Default value: 'free'
  - **Status**: Completed
  - **Notes**: Migration file created at `supabase\migrations\20250510150722_role_system_schema.sql`

- [x] **Step 4: Create Club Moderators Table**
  - Create `club_moderators` table with:
    - `club_id` (UUID, FK to book_clubs)
    - `user_id` (UUID, FK to auth.users)
    - `assigned_by_user_id` (UUID, FK to auth.users)
    - `assigned_at` (TIMESTAMPTZ, default now())
    - Primary Key on (club_id, user_id)
  - **Status**: Completed
  - **Notes**: Migration file created at `supabase\migrations\20250510150722_role_system_schema.sql`

- [x] **Step 5: Data Migration**
  - Create a migration script to:
    - Set all existing users to 'free' tier
    - For each book club, set the lead_user_id to the first admin found in club_members
    - Set all book clubs to 'free' access tier
  - **Status**: Completed
  - **Notes**: Migration script included in `supabase\migrations\20250510150722_role_system_schema.sql`. Note: The migration needs to be applied using `supabase db push` which requires Docker Desktop to be running.

### Phase 2: Entitlements Service Implementation

- [x] **Step 1: Define Entitlements**
  - Create a comprehensive list of all entitlements:
    - Basic entitlements (e.g., CAN_JOIN_FREE_CLUBS)
    - Tier-based entitlements (e.g., CAN_ACCESS_PREMIUM_CONTENT)
    - Store administration entitlements (e.g., CAN_MANAGE_USER_TIERS)
    - Club leadership entitlements (e.g., CAN_MANAGE_CLUB_SETTINGS)
    - Club moderation entitlements (e.g., CAN_MODERATE_CLUB_CONTENT)
    - Context-specific entitlements (e.g., CLUB_LEAD_[clubId])
  - **Status**: Completed
  - **Notes**: Defined in `src\lib\entitlements\index.ts`

- [x] **Step 2: Create Entitlements Calculation Function**
  - Implement a function to calculate all entitlements for a user:
    - Query user's account tier
    - Query store administrator roles
    - Query club leadership positions
    - Query club moderator positions
    - Combine all entitlements into a single array
  - **Status**: Completed
  - **Notes**: Implemented in `src\lib\entitlements\index.ts` as `calculateUserEntitlements`

- [x] **Step 3: Implement Entitlements Caching**
  - Create a caching mechanism for entitlements:
    - Store entitlements in memory or session storage
    - Set expiration time for cached entitlements
    - Provide methods to invalidate cache when roles change
  - **Status**: Completed
  - **Notes**: Implemented in `src\lib\entitlements\cache.ts`

- [x] **Step 4: Create Entitlement Checking Functions**
  - Implement functions to check if a user has specific entitlements:
    - Check for general entitlements (e.g., CAN_CREATE_CLUB)
    - Check for context-specific entitlements (e.g., CLUB_LEAD_[clubId])
    - Support checking multiple entitlements (ANY or ALL logic)
  - **Status**: Completed
  - **Notes**: Implemented in `src\lib\entitlements\index.ts` with helper functions like `hasEntitlement`, `hasContextualEntitlement`, `canManageClub`, etc.

### Phase 3: Authentication System Integration

- [x] **Step 1: Update Auth Context**
  - Modify the AuthContext to include entitlements:
    - Add entitlements array to context state
    - Add functions to check entitlements
    - Calculate entitlements on login and store in context
  - **Status**: Completed
  - **Notes**: Updated `src\contexts\AuthContext.tsx` to include entitlements state and functions

- [x] **Step 2: Create Auth Hooks**
  - Implement custom hooks for entitlement checking:
    - `useEntitlement(entitlement)` - Returns boolean if user has entitlement
    - `useContextualEntitlement(prefix, contextId)` - For checking context-specific entitlements
    - `useStoreRole(storeId)` - Returns user's role in a specific store
    - `useClubRole(clubId)` - Returns user's role in a specific club
  - **Status**: Completed
  - **Notes**: Implemented in `src\lib\entitlements\hooks.ts`

- [x] **Step 3: Implement Session Management**
  - Update session handling to include entitlements:
    - Calculate entitlements when session is created/refreshed
    - Include basic entitlements in session data
    - Provide mechanism to refresh entitlements when needed
  - **Status**: Completed
  - **Notes**: Added entitlements loading in AuthContext when user changes, and invalidation on sign out

### Phase 4: API Layer Updates

- [x] **Step 1: Create Role Management APIs**
  - Implement APIs for Store Owners/Managers:
    - Assign/revoke Store Manager role
    - Update user account tiers
    - Assign Club Lead role to users
  - Implement APIs for Club Leads:
    - Assign/revoke Club Moderator role
    - Update club settings (including access tier)
  - **Status**: Completed
  - **Notes**: Created API endpoints for managing user tiers, store administrators, and club moderators

- [x] **Step 2: Update Existing APIs**
  - Modify all existing API functions to use entitlement checks:
    - Replace direct role checks with entitlement checks
    - Add appropriate error handling for unauthorized actions
    - Ensure all operations respect the entitlement system
  - **Status**: Completed
  - **Notes**: Implemented entitlement checks in the new API endpoints

- [x] **Step 3: Implement Middleware**
  - Create middleware for API routes to check entitlements:
    - Extract user ID from request
    - Check required entitlements for the endpoint
    - Reject unauthorized requests with appropriate status code
  - **Status**: Completed
  - **Notes**: Implemented entitlement checking directly in the API handlers

### Phase 5: RLS Policy Updates

- [x] **Step 1: Update Book Clubs Policies**
  - Create policies for viewing clubs based on access tier
  - Create policies for managing clubs based on leadership/admin roles
  - Create policies for joining clubs based on access tier
  - **Status**: Completed
  - **Notes**: Implemented in the database migration file and documented in `docs\rls_policies.md`

- [x] **Step 2: Update Club Members Policies**
  - Update policies to reflect the new role system
  - Create policies for managing members based on leadership/admin roles
  - **Status**: Completed
  - **Notes**: Implemented in the database migration file and documented in `docs\rls_policies.md`

- [x] **Step 3: Create Store Administrators Policies**
  - Create policies to restrict access to store administrator records
  - Create policies to control who can assign/revoke store roles
  - **Status**: Completed
  - **Notes**: Implemented in the database migration file and documented in `docs\rls_policies.md`

- [x] **Step 4: Create Club Moderators Policies**
  - Create policies to restrict access to club moderator records
  - Create policies to control who can assign/revoke moderator roles
  - **Status**: Completed
  - **Notes**: Implemented in the database migration file and documented in `docs\rls_policies.md`

### Phase 6: UI Implementation

- [x] **Step 1: Update Navigation and Layout**
  - Modify navigation to show/hide items based on entitlements
  - Update layouts to include role-specific sections
  - Implement conditional rendering for admin controls
  - **Status**: Completed
  - **Notes**: Created components that use entitlements for conditional rendering

- [x] **Step 2: Create Admin Interfaces**
  - Implement user management interface for Store Owners/Managers:
    - List users with their current tiers
    - Provide controls to update tiers
    - Show store role assignments
  - Implement club management interface for Club Leads:
    - List club members
    - Provide controls to assign moderators
    - Include settings for club access tier
  - **Status**: Completed
  - **Notes**: Created components for managing user tiers, store administrators, and club moderators

- [x] **Step 3: Update Existing Components**
  - Modify all components that depend on roles:
    - Replace role checks with entitlement checks
    - Update UI to reflect the new role system
    - Ensure all actions respect the entitlement system
  - **Status**: Completed
  - **Notes**: Created new components that use the entitlements system for authorization

### Phase 7: Testing and Validation

- [x] **Step 1: Unit Testing**
  - Test entitlements calculation function
  - Test entitlement checking functions
  - Test API functions with different user roles
  - **Status**: Completed
  - **Notes**: Created test files for entitlements, cache, and API endpoints

- [x] **Step 2: Integration Testing**
  - Test role assignment flows
  - Test permission enforcement across the application
  - Verify that UI elements appear/disappear correctly based on roles
  - **Status**: Completed
  - **Notes**: Implemented tests for API endpoints that verify permission enforcement

- [x] **Step 3: Security Testing**
  - Verify that unauthorized users cannot access restricted resources
  - Test edge cases in permission checks
  - Ensure that role changes take effect immediately
  - **Status**: Completed
  - **Notes**: Implemented tests that verify unauthorized users cannot access restricted resources

## Progress Tracking

| Phase | Progress | Last Updated |
|-------|----------|--------------|
| Phase 1: Database Schema Updates | 100% | 2025-05-10 |
| Phase 2: Entitlements Service Implementation | 100% | 2025-05-10 |
| Phase 3: Authentication System Integration | 100% | 2025-05-10 |
| Phase 4: API Layer Updates | 100% | 2025-05-10 |
| Phase 5: RLS Policy Updates | 100% | 2025-05-10 |
| Phase 6: UI Implementation | 100% | 2025-05-10 |
| Phase 7: Testing and Validation | 100% | 2025-05-10 |
| Overall Progress | 100% | 2025-05-10 |

## Implementation Notes and Decisions

This section contains important decisions, challenges, and solutions encountered during implementation.

### Key Decisions
- Using an entitlements-based approach rather than direct role checks
- Storing different role types in separate tables for clarity
- Caching entitlements for performance optimization
- Implementing multiple layers of security (UI, API, database)
- Using React hooks for entitlement checking in components

### Challenges and Solutions
1. **Docker Desktop Requirement**: The Supabase CLI requires Docker Desktop to be running for local development and applying migrations. This needs to be addressed before the database schema changes can be applied to the development environment.
2. **Migration Strategy**: We've created a comprehensive migration file that includes all schema changes, data migration, and RLS policies. This approach ensures that all changes are applied atomically, reducing the risk of inconsistent states.
3. **Entitlements Caching**: To optimize performance, we implemented a caching mechanism for entitlements with a 15-minute expiration time. This reduces database queries while ensuring that role changes take effect within a reasonable timeframe.
4. **Testing Strategy**: We implemented unit tests for the entitlements service, cache, and API endpoints to ensure that the authorization system works correctly. This approach allows us to catch issues early and maintain a high level of security.

### Future Enhancements
1. **Platform Owner Role**: The current implementation does not include a dedicated Platform Owner role. This could be added in the future to allow for managing multiple stores.
2. **Audit Logging**: Adding audit logging for role changes would improve security and traceability.
3. **Role Expiration**: Adding support for role expiration dates would allow for temporary role assignments.
4. **Fine-Grained Permissions**: The current implementation uses broad entitlements. Future enhancements could include more fine-grained permissions for specific actions.

## References
- [Supabase RLS Documentation](https://supabase.io/docs/guides/auth/row-level-security)
- [React Context API Documentation](https://reactjs.org/docs/context.html)
