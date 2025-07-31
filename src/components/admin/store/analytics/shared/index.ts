/**
 * Shared Analytics Components
 * 
 * Common components used across different analytics dashboards
 * to ensure consistency and reduce code duplication
 */

export { AnalyticsPageLayout } from './AnalyticsPageLayout';
export { AnalyticsPageHeader } from './AnalyticsPageHeader';
export { MetricCard } from './MetricCard';
export { TimeRangeSelector } from './TimeRangeSelector';
export { AnalyticsDataNotice } from './AnalyticsDataNotice';
export { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';
export { AnalyticsErrorMessage } from './AnalyticsErrorMessage';

// Re-export types for convenience
export type { default as AnalyticsPageLayoutProps } from './AnalyticsPageLayout';
export type { default as AnalyticsPageHeaderProps } from './AnalyticsPageHeader';
export type { default as MetricCardProps } from './MetricCard';
export type { default as TimeRangeSelectorProps } from './TimeRangeSelector';
export type { default as AnalyticsDataNoticeProps } from './AnalyticsDataNotice';
