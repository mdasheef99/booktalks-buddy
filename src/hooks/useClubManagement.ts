/**
 * Club Management Hooks
 *
 * This file maintains backward compatibility by re-exporting
 * all hooks from the modular structure.
 *
 * For new code, import directly from the specific modules:
 * - '@/hooks/clubManagement/useClubAnalytics'
 * - '@/hooks/clubManagement/useEnhancedAnalytics'
 * - '@/hooks/clubManagement/useClubModerators'
 * - '@/hooks/clubManagement/useAnalyticsHistory'
 * - '@/hooks/clubManagement/useAnalyticsAccess'
 */

// Re-export all hooks from the modular structure
export * from './clubManagement';


