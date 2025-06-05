/**
 * Store Analytics Types
 * 
 * Type definitions for store analytics functionality
 */

// Basic analytics data structure
export interface BasicAnalytics {
  id: string;
  store_id: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_time_on_page: number;
  chat_button_clicks: number;
  carousel_interactions: number;
  banner_clicks: number;
  date: string;
  created_at: string;
}

// Performance alert types
export interface PerformanceAlert {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  recommendation?: string;
  priority: 'low' | 'medium' | 'high';
}

// Recommendation types
export interface BasicRecommendation {
  category: 'content' | 'engagement' | 'performance';
  title: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

// Analytics summary interface
export interface AnalyticsSummary {
  totalPageViews: number;
  totalUniqueVisitors: number;
  averageBounceRate: number;
  averageTimeOnPage: number;
  totalChatClicks: number;
  totalCarouselInteractions: number;
  totalBannerClicks: number;
  returnVisitorRate: number;
  averageSessionDuration: number;
  mobileVsDesktopRatio: { mobile: number; desktop: number };
  period: string;
}

// Section analytics interface
export interface SectionAnalytics {
  sectionName: string;
  totalViews: number;
  uniqueVisitors: number;
  averageTimeSpent: number;
  interactionRate: number;
  topElements?: Array<{
    elementId: string;
    elementType: string;
    interactions: number;
  }>;
}

// Enhanced analytics with detailed breakdowns
export interface EnhancedAnalytics {
  summary: AnalyticsSummary;
  sectionBreakdown: SectionAnalytics[];
  heroAnalytics: {
    customQuoteViews: number;
    chatButtonClickRate: number;
    heroEngagementRate: number;
  };
  carouselAnalytics: {
    totalBookClicks: number;
    carouselInteractionRate: number;
    mostPopularBooks: Array<{
      bookTitle: string;
      clicks: number;
    }>;
  };
  bannerAnalytics: {
    totalImpressions: number;
    clickThroughRate: number;
    bannerPerformance: Array<{
      bannerId: string;
      impressions: number;
      clicks: number;
      ctr: number;
    }>;
  };
  communityAnalytics: {
    spotlightViews: number;
    testimonialEngagement: number;
    communityInteractionRate: number;
  };
  quoteAnalytics: {
    rotationEffectiveness: number;
    quoteEngagementRate: number;
    averageViewTime: number;
  };
}

// Simple metrics for dashboard display
export interface SimpleMetrics {
  pageViews: number;
  chatClicks: number;
  bounceRate: number;
  hasData: boolean;
}

// Analytics event data structure
export interface AnalyticsEvent {
  id?: string;
  store_id: string;
  event_type: string;
  section_name?: string;
  element_id?: string;
  element_type?: string;
  session_id?: string;
  user_id?: string;
  user_agent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Analytics query options
export interface AnalyticsQueryOptions {
  storeId: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
  sections?: string[];
}

// Analytics aggregation result
export interface AnalyticsAggregation {
  total_events: number;
  unique_sessions: number;
  unique_users: number;
  event_breakdown: Record<string, number>;
  section_breakdown: Record<string, number>;
  time_series: Array<{
    date: string;
    count: number;
  }>;
}
