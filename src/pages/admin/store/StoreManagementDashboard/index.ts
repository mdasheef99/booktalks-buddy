/**
 * Store Management Dashboard - Main Export
 * 
 * Aggregates all dashboard components with proper type exports
 */

// =========================
// Type Exports
// =========================
export type {
  DashboardStats,
  QuickAction,
  ManagementSection,
  DashboardProps
} from './types';

// =========================
// Component Exports
// =========================
export { StoreManagementDashboard } from './StoreManagementDashboard';
export { DashboardHeader } from './components/DashboardHeader';
export { OverviewStatistics } from './components/OverviewStatistics';
export { QuickActions } from './components/QuickActions';
export { ManagementSections } from './components/ManagementSections';
export { LandingPageStatus } from './components/LandingPageStatus';
export { QuickTips } from './components/QuickTips';

// =========================
// Hook Exports
// =========================
export { useDashboardData } from './hooks/useDashboardData';
export { useDashboardStats } from './hooks/useDashboardStats';

// =========================
// Utility Exports
// =========================
export { 
  createQuickActions,
  createManagementSections,
  calculateDashboardStats
} from './utils/dashboardUtils';
