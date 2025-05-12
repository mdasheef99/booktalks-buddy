# AdminDashboardPage Refactoring Plan

## Current Issues
- The file is too large (647 lines) and contains multiple responsibilities
- The data fetching logic is complex and mixed with UI rendering
- Time range filtering logic is embedded directly in the component
- Multiple card components with repetitive structures
- Loading state handling is mixed with the main component

## Refactoring Goals
- Break down the large component into smaller, focused components
- Separate data fetching logic from UI rendering
- Create reusable card components for dashboard metrics
- Improve code organization and maintainability
- Implement proper TypeScript typing throughout

## Proposed File Structure

```
src/
├── pages/
│   └── admin/
│       ├── AdminDashboardPage.tsx (main container, significantly reduced)
│       └── dashboard/
│           ├── index.ts (exports all dashboard components)
│           ├── types.ts (shared types for dashboard components)
│           ├── hooks/
│           │   ├── useAdminStats.ts (data fetching logic)
│           │   └── useTimeRangeFilter.ts (time range filtering logic)
│           ├── components/
│           │   ├── DashboardHeader.tsx (title and navigation)
│           │   ├── TimeRangeFilter.tsx (time range selection)
│           │   ├── LoadingDashboard.tsx (loading state UI)
│           │   ├── StatsCard.tsx (reusable card component)
│           │   ├── MainStatsRow.tsx (first row of stats)
│           │   ├── QuickStatsRow.tsx (second row of stats)
│           │   ├── TierDistributionCard.tsx (user tier distribution)
│           │   └── RecentActivityCard.tsx (recent activity)
│           └── utils/
│               ├── dateUtils.ts (date calculation functions)
│               └── statsCalculations.ts (statistics calculation functions)
```

## Detailed Component Breakdown

### 1. Types (types.ts)
- Define shared TypeScript interfaces for stats data
- Define TimeRange type and other shared types

### 2. Data Fetching (useAdminStats.ts)
- Extract all Supabase queries into a custom hook
- Implement proper error handling
- Return loading state, error state, and stats data
- Accept time range as a parameter

### 3. Time Range Filtering (useTimeRangeFilter.ts)
- Extract time range calculation logic
- Provide functions to convert time range to date ranges
- Handle all time range related calculations

### 4. Main Container (AdminDashboardPage.tsx)
- Import and compose smaller components
- Handle routing and high-level state
- Significantly reduced in size (< 100 lines)

### 5. Dashboard Header (DashboardHeader.tsx)
- Back button
- Dashboard title
- Navigation buttons to analytics and requests

### 6. Time Range Filter (TimeRangeFilter.tsx)
- Time range selection buttons
- Handle time range state changes

### 7. Loading State (LoadingDashboard.tsx)
- Extract loading skeleton UI to separate component

### 8. Reusable Stats Card (StatsCard.tsx)
- Create a reusable card component for metrics
- Accept icon, title, value, and secondary text as props
- Handle different card sizes and layouts

### 9. Main Stats Row (MainStatsRow.tsx)
- Compose StatsCard components for main metrics
- Handle layout for the first row of stats

### 10. Quick Stats Row (QuickStatsRow.tsx)
- Compose StatsCard components for secondary metrics
- Handle layout for the second row of stats

### 11. Tier Distribution Card (TierDistributionCard.tsx)
- Extract tier distribution visualization
- Handle percentage calculations and bar chart

### 12. Recent Activity Card (RecentActivityCard.tsx)
- Display recent activity data
- Placeholder for future activity feed implementation

### 13. Utility Functions
- Extract date calculations to dateUtils.ts
- Extract statistics calculations to statsCalculations.ts

## Implementation Plan

### Phase 1: Setup Structure and Types
1. Create the folder structure
2. Define shared types in types.ts
3. Create utility functions for date and stats calculations

### Phase 2: Extract Data Logic
1. Create useAdminStats hook with all Supabase queries
2. Create useTimeRangeFilter hook for time range handling
3. Test data fetching independently

### Phase 3: Create UI Components
1. Create reusable StatsCard component
2. Implement DashboardHeader and TimeRangeFilter
3. Implement LoadingDashboard component
4. Create row components (MainStatsRow, QuickStatsRow)
5. Implement specialized cards (TierDistributionCard, RecentActivityCard)

### Phase 4: Refactor Main Component
1. Refactor AdminDashboardPage.tsx to use the new components
2. Remove duplicated code and logic
3. Ensure proper prop passing and state management

### Phase 5: Testing and Optimization
1. Test all components individually
2. Test the complete dashboard functionality
3. Optimize performance (memoization, etc.)
4. Add proper error handling throughout

## Benefits of This Refactoring
- Improved code organization and maintainability
- Better separation of concerns
- Reusable components that can be used elsewhere
- Easier testing of individual components
- Improved performance through optimized rendering
- Better developer experience when making future changes
