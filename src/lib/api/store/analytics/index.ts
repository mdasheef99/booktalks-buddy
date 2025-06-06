/**
 * Store Analytics Module - Main Export
 * 
 * Aggregates all analytics functionality with proper type exports
 */

// =========================
// Type Exports
// =========================
export type {
  BasicAnalytics,
  PerformanceAlert,
  BasicRecommendation,
  AnalyticsSummary,
  SectionAnalytics,
  EnhancedAnalytics,
  SimpleMetrics,
  AnalyticsEvent,
  AnalyticsQueryOptions,
  AnalyticsAggregation
} from './types';

// =========================
// Metrics Collection
// =========================
export {
  getAnalyticsSummary,
  getAnalyticsData,
  getEventCounts,
  getUniqueSessionCount,
  getUniqueVisitorCount,
  calculateBounceRate,
  getTimeSeriesData
} from './metrics-collection';

// =========================
// Summary Analytics
// =========================
export {
  getEnhancedSummary,
  getSimpleMetrics,
  getComparativeAnalytics,
  getTopMetrics,
  getEngagementMetrics,
  getPerformanceScore
} from './summary-analytics';

// =========================
// Section Analytics
// =========================
export {
  getSectionAnalytics,
  getSectionAnalyticsById,
  getTopSections,
  getSectionComparison,
  getElementPerformance,
  getSectionTrends,
  getSectionHeatmap
} from './section-analytics';

// =========================
// Performance Alerts
// =========================
export {
  getPerformanceAlerts,
  getTrafficAlerts,
  getEngagementAlerts,
  getTimeBasedAlerts,
  getAllAlerts,
  getPriorityAlerts
} from './performance-alerts';

// =========================
// Recommendations
// =========================
export {
  getBasicRecommendations,
  getContentRecommendations,
  getEngagementRecommendations,
  getPerformanceRecommendations,
  getPrioritizedRecommendations,
  getRecommendationsByCategory
} from './recommendations';

// =========================
// Enhanced Analytics
// =========================
export {
  getEnhancedAnalytics,
  getHeroAnalytics,
  getCarouselAnalytics,
  getBannerAnalytics,
  getCommunityAnalytics,
  getAnalyticsDashboard
} from './enhanced-analytics';

// =========================
// Utility Functions
// =========================
export {
  hasAnalyticsData,
  formatAnalyticsNumber,
  calculatePercentageChange,
  getDateRangeOptions,
  validateAnalyticsParams,
  generateAnalyticsExport,
  calculateHealthScore,
  getAnalyticsInsights
} from './utils';

// =========================
// Analytics API Class (Legacy Compatibility)
// =========================

/**
 * Analytics API Class - Maintains backward compatibility
 */
export class AnalyticsAPI {
  /**
   * Get basic analytics summary for a store
   */
  static async getAnalyticsSummary(storeId: string, days: number = 30) {
    const { getAnalyticsSummary } = await import('./metrics-collection');
    return getAnalyticsSummary(storeId, days);
  }

  /**
   * Generate basic performance alerts based on analytics data
   */
  static async getPerformanceAlerts(storeId: string) {
    const { getPerformanceAlerts } = await import('./performance-alerts');
    return getPerformanceAlerts(storeId);
  }

  /**
   * Generate basic recommendations for store improvement
   */
  static async getBasicRecommendations(storeId: string) {
    const { getBasicRecommendations } = await import('./recommendations');
    return getBasicRecommendations(storeId);
  }

  /**
   * Check if analytics data exists for a store
   */
  static async hasAnalyticsData(storeId: string) {
    const { hasAnalyticsData } = await import('./utils');
    return hasAnalyticsData(storeId);
  }

  /**
   * Get simple metrics for dashboard display
   */
  static async getSimpleMetrics(storeId: string) {
    const { getSimpleMetrics } = await import('./summary-analytics');
    return getSimpleMetrics(storeId);
  }

  /**
   * Get section-specific analytics breakdown
   */
  static async getSectionAnalytics(storeId: string, days: number = 30) {
    const { getSectionAnalytics } = await import('./section-analytics');
    return getSectionAnalytics(storeId, days);
  }

  /**
   * Get enhanced analytics with section breakdown
   */
  static async getEnhancedAnalytics(storeId: string, days: number = 30) {
    const { getEnhancedAnalytics } = await import('./enhanced-analytics');
    return getEnhancedAnalytics(storeId, days);
  }
}

// =========================
// Convenience Functions
// =========================

/**
 * Get analytics summary with default options
 */
export async function getAnalyticsSummaryDefault(storeId: string) {
  const { getAnalyticsSummary } = await import('./metrics-collection');
  return getAnalyticsSummary(storeId);
}

/**
 * Get performance alerts with default options
 */
export async function getPerformanceAlertsDefault(storeId: string) {
  const { getPerformanceAlerts } = await import('./performance-alerts');
  return getPerformanceAlerts(storeId);
}

/**
 * Get basic recommendations with default options
 */
export async function getBasicRecommendationsDefault(storeId: string) {
  const { getBasicRecommendations } = await import('./recommendations');
  return getBasicRecommendations(storeId);
}

/**
 * Get enhanced analytics with default options
 */
export async function getEnhancedAnalyticsDefault(storeId: string) {
  const { getEnhancedAnalytics } = await import('./enhanced-analytics');
  return getEnhancedAnalytics(storeId);
}
