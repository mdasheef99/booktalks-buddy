/**
 * Banner Analytics Components
 * 
 * Export all banner analytics components for easy importing
 * Follows BookTalks Buddy component organization patterns
 */

// =========================
// Core Dashboard Components
// =========================

export { 
  BannerAnalyticsGrid, 
  BannerAnalyticsGridCompact 
} from './BannerAnalyticsGrid';

export { 
  MultiBannerPerformanceTable 
} from './MultiBannerPerformanceTable';

// =========================
// Visualization Components
// =========================

export { 
  BannerComparisonChart 
} from './BannerComparisonChart';

export { 
  BannerTimeSeriesChart 
} from './BannerTimeSeriesChart';

// =========================
// Advanced Features
// =========================

export { 
  BannerInsightsSection 
} from './BannerInsightsSection';

// =========================
// Type Exports
// =========================

// Re-export types from the main API for convenience
export type {
  MultiBannerAnalyticsSummary,
  BannerPerformanceDetail,
  BannerTimeSeriesData,
  BannerComparisonData,
  BannerAnalyticsOptions
} from '@/lib/api/store/bannerAnalytics';

// Component prop types for external use
export type { default as BannerAnalyticsGridProps } from './BannerAnalyticsGrid';
export type { default as MultiBannerPerformanceTableProps } from './MultiBannerPerformanceTable';
export type { default as BannerComparisonChartProps } from './BannerComparisonChart';
export type { default as BannerTimeSeriesChartProps } from './BannerTimeSeriesChart';
export type { default as BannerInsightsSectionProps } from './BannerInsightsSection';

// =========================
// Utility Exports
// =========================

// Re-export utility functions for external use
export {
  formatCTR,
  formatNumber,
  getPerformanceColor
} from '@/lib/api/store/bannerAnalytics';
