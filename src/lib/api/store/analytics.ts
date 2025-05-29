import { supabase } from '@/lib/supabase';

/**
 * Landing Page Analytics API for Store Management
 * REDUCED SCOPE: Basic performance alerts and recommendations only
 */

// Types for basic analytics
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

export interface PerformanceAlert {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  recommendation?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface BasicRecommendation {
  category: 'content' | 'engagement' | 'performance';
  title: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

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

/**
 * Analytics API Class - Basic Performance Alerts Only
 */
export class AnalyticsAPI {
  /**
   * Get basic analytics summary for a store
   */
  static async getAnalyticsSummary(storeId: string, days: number = 30): Promise<AnalyticsSummary> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('store_landing_analytics')
        .select('*')
        .eq('store_id', storeId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Calculate summary from event data
      const analytics = data || [];

      // Group events by type for calculations
      const pageLoads = analytics.filter(event => event.event_type === 'page_load');
      const chatClicks = analytics.filter(event => event.event_type === 'chat_button_click');
      const carouselInteractions = analytics.filter(event => event.event_type === 'carousel_click');
      const bannerClicks = analytics.filter(event => event.event_type === 'banner_click');

      // Calculate unique sessions and visitors
      const uniqueSessions = new Set(analytics.map(event => event.session_id)).size;
      const uniqueVisitors = new Set(analytics.map(event => event.user_id).filter(Boolean)).size;

      // Calculate mobile vs desktop ratio
      const mobileEvents = analytics.filter(event =>
        event.user_agent && event.user_agent.toLowerCase().includes('mobile')
      ).length;
      const totalEvents = analytics.length;
      const mobileRatio = totalEvents > 0 ? (mobileEvents / totalEvents) * 100 : 0;

      // Calculate return visitor rate (simplified)
      const returnVisitorRate = uniqueVisitors > 0 ? Math.min((uniqueSessions - uniqueVisitors) / uniqueVisitors * 100, 100) : 0;

      const summary: AnalyticsSummary = {
        totalPageViews: pageLoads.length,
        totalUniqueVisitors: uniqueVisitors || uniqueSessions, // Fallback to sessions if no user IDs
        averageBounceRate: 0, // Will be calculated based on session behavior
        averageTimeOnPage: 0, // Will be calculated from interaction data
        totalChatClicks: chatClicks.length,
        totalCarouselInteractions: carouselInteractions.length,
        totalBannerClicks: bannerClicks.length,
        returnVisitorRate: Math.max(0, returnVisitorRate),
        averageSessionDuration: 0, // Will be calculated from session data
        mobileVsDesktopRatio: {
          mobile: Math.round(mobileRatio),
          desktop: Math.round(100 - mobileRatio)
        },
        period: `${days} days`
      };

      return summary;
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      // Return empty summary on error
      return {
        totalPageViews: 0,
        totalUniqueVisitors: 0,
        averageBounceRate: 0,
        averageTimeOnPage: 0,
        totalChatClicks: 0,
        totalCarouselInteractions: 0,
        totalBannerClicks: 0,
        period: `${days} days`
      };
    }
  }

  /**
   * Generate basic performance alerts based on analytics data
   */
  static async getPerformanceAlerts(storeId: string): Promise<PerformanceAlert[]> {
    try {
      const summary = await this.getAnalyticsSummary(storeId, 30);
      const alerts: PerformanceAlert[] = [];

      // High bounce rate alert
      if (summary.averageBounceRate > 70) {
        alerts.push({
          type: 'warning',
          title: 'High Bounce Rate',
          message: `Your bounce rate is ${summary.averageBounceRate.toFixed(1)}%, which is above the recommended 70%.`,
          recommendation: 'Consider adding more engaging content or improving page load speed.',
          priority: 'high'
        });
      }

      // Low engagement alert
      if (summary.totalChatClicks < 10 && summary.totalPageViews > 100) {
        alerts.push({
          type: 'warning',
          title: 'Low Chat Engagement',
          message: 'Your chat button has low click-through rate.',
          recommendation: 'Try customizing the chat button text or position to make it more appealing.',
          priority: 'medium'
        });
      }

      // Carousel performance alert
      if (summary.totalCarouselInteractions < 5 && summary.totalPageViews > 50) {
        alerts.push({
          type: 'info',
          title: 'Carousel Needs Attention',
          message: 'Your book carousel has low interaction rates.',
          recommendation: 'Consider updating featured books or improving book descriptions.',
          priority: 'medium'
        });
      }

      // Good performance recognition
      if (summary.averageBounceRate < 50 && summary.totalPageViews > 0) {
        alerts.push({
          type: 'success',
          title: 'Great Engagement!',
          message: `Excellent bounce rate of ${summary.averageBounceRate.toFixed(1)}%`,
          recommendation: 'Keep up the good work with your current content strategy.',
          priority: 'low'
        });
      }

      // No data alert
      if (summary.totalPageViews === 0) {
        alerts.push({
          type: 'info',
          title: 'No Analytics Data',
          message: 'No visitor data available for the past 30 days.',
          recommendation: 'Analytics tracking will begin collecting data as visitors use your landing page.',
          priority: 'low'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error generating performance alerts:', error);
      return [{
        type: 'warning',
        title: 'Analytics Unavailable',
        message: 'Unable to load performance data at this time.',
        recommendation: 'Please try refreshing the page or contact support if the issue persists.',
        priority: 'low'
      }];
    }
  }

  /**
   * Generate basic recommendations for store improvement
   */
  static async getBasicRecommendations(storeId: string): Promise<BasicRecommendation[]> {
    try {
      const summary = await this.getAnalyticsSummary(storeId, 30);
      const recommendations: BasicRecommendation[] = [];

      // Content recommendations
      if (summary.totalPageViews > 0) {
        if (summary.totalCarouselInteractions / summary.totalPageViews < 0.1) {
          recommendations.push({
            category: 'content',
            title: 'Improve Book Carousel',
            description: 'Your carousel has low engagement rates.',
            action: 'Update featured books with popular or trending titles',
            impact: 'medium'
          });
        }

        if (summary.totalBannerClicks / summary.totalPageViews < 0.05) {
          recommendations.push({
            category: 'content',
            title: 'Optimize Promotional Banners',
            description: 'Banner click-through rates could be improved.',
            action: 'Create more compelling banner content or calls-to-action',
            impact: 'medium'
          });
        }
      }

      // Engagement recommendations
      if (summary.averageTimeOnPage < 60) {
        recommendations.push({
          category: 'engagement',
          title: 'Increase Page Engagement',
          description: 'Visitors are spending less than a minute on your page.',
          action: 'Add more interactive content or improve page layout',
          impact: 'high'
        });
      }

      // Performance recommendations
      if (summary.averageBounceRate > 60) {
        recommendations.push({
          category: 'performance',
          title: 'Reduce Bounce Rate',
          description: 'Many visitors leave without exploring your content.',
          action: 'Improve page loading speed and add engaging hero content',
          impact: 'high'
        });
      }

      // Default recommendations for new stores
      if (summary.totalPageViews === 0) {
        recommendations.push({
          category: 'content',
          title: 'Complete Your Setup',
          description: 'Ensure all landing page sections are configured.',
          action: 'Add books to carousel, create banners, and customize hero section',
          impact: 'high'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [{
        category: 'performance',
        title: 'System Check',
        description: 'Unable to generate recommendations at this time.',
        action: 'Please refresh the page or contact support',
        impact: 'low'
      }];
    }
  }

  /**
   * Check if analytics data exists for a store
   */
  static async hasAnalyticsData(storeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('store_landing_analytics')
        .select('id')
        .eq('store_id', storeId)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking analytics data:', error);
      return false;
    }
  }

  /**
   * Get simple metrics for dashboard display
   */
  static async getSimpleMetrics(storeId: string): Promise<{
    pageViews: number;
    chatClicks: number;
    bounceRate: number;
    hasData: boolean;
  }> {
    try {
      const summary = await this.getAnalyticsSummary(storeId, 7); // Last 7 days

      return {
        pageViews: summary.totalPageViews,
        chatClicks: summary.totalChatClicks,
        bounceRate: Math.round(summary.averageBounceRate),
        hasData: summary.totalPageViews > 0
      };
    } catch (error) {
      console.error('Error fetching simple metrics:', error);
      return {
        pageViews: 0,
        chatClicks: 0,
        bounceRate: 0,
        hasData: false
      };
    }
  }

  /**
   * Get section-specific analytics breakdown
   */
  static async getSectionAnalytics(storeId: string, days: number = 30): Promise<SectionAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('store_landing_analytics')
        .select('*')
        .eq('store_id', storeId)
        .gte('timestamp', startDate.toISOString())
        .not('section_name', 'is', null);

      if (error) throw error;

      const analytics = data || [];
      const sectionMap = new Map<string, any>();

      // Group by section
      analytics.forEach(event => {
        const section = event.section_name;
        if (!section) return;

        if (!sectionMap.has(section)) {
          sectionMap.set(section, {
            sectionName: section,
            totalViews: 0,
            uniqueVisitors: new Set(),
            interactions: [],
            elements: new Map()
          });
        }

        const sectionData = sectionMap.get(section);

        if (event.event_type.includes('view')) {
          sectionData.totalViews++;
        }

        if (event.session_id) {
          sectionData.uniqueVisitors.add(event.session_id);
        }

        if (event.event_type.includes('click')) {
          sectionData.interactions.push(event);
        }

        // Track element performance
        if (event.element_id && event.element_type) {
          const elementKey = `${event.element_id}-${event.element_type}`;
          const elementData = sectionData.elements.get(elementKey) || {
            elementId: event.element_id,
            elementType: event.element_type,
            interactions: 0
          };
          elementData.interactions++;
          sectionData.elements.set(elementKey, elementData);
        }
      });

      // Convert to final format
      return Array.from(sectionMap.values()).map(section => ({
        sectionName: section.sectionName,
        totalViews: section.totalViews,
        uniqueVisitors: section.uniqueVisitors.size,
        averageTimeSpent: 0, // Simplified for basic implementation
        interactionRate: section.totalViews > 0 ? (section.interactions.length / section.totalViews) * 100 : 0,
        topElements: Array.from(section.elements.values())
          .sort((a, b) => b.interactions - a.interactions)
          .slice(0, 3)
      }));
    } catch (error) {
      console.error('Error fetching section analytics:', error);
      return [];
    }
  }

  /**
   * Get enhanced analytics with section breakdown
   */
  static async getEnhancedAnalytics(storeId: string, days: number = 30): Promise<EnhancedAnalytics> {
    try {
      const [summary, sectionBreakdown] = await Promise.all([
        this.getAnalyticsSummary(storeId, days),
        this.getSectionAnalytics(storeId, days)
      ]);

      // Get section-specific data
      const heroSection = sectionBreakdown.find(s => s.sectionName === 'hero') || { totalViews: 0, interactionRate: 0 };
      const carouselSection = sectionBreakdown.find(s => s.sectionName === 'carousel') || { totalViews: 0, interactionRate: 0, topElements: [] };
      const bannerSection = sectionBreakdown.find(s => s.sectionName === 'banners') || { totalViews: 0, interactionRate: 0, topElements: [] };
      const communitySection = sectionBreakdown.find(s => s.sectionName === 'community') || { totalViews: 0, interactionRate: 0 };
      const quoteSection = sectionBreakdown.find(s => s.sectionName === 'quote') || { totalViews: 0, interactionRate: 0 };

      return {
        summary,
        sectionBreakdown,
        heroAnalytics: {
          customQuoteViews: heroSection.totalViews,
          chatButtonClickRate: summary.totalPageViews > 0 ? (summary.totalChatClicks / summary.totalPageViews) * 100 : 0,
          heroEngagementRate: heroSection.interactionRate
        },
        carouselAnalytics: {
          totalBookClicks: summary.totalCarouselInteractions,
          carouselInteractionRate: carouselSection.interactionRate,
          mostPopularBooks: carouselSection.topElements?.map(el => ({
            bookTitle: `Book ${el.elementId}`, // Simplified - would need book title lookup
            clicks: el.interactions
          })) || []
        },
        bannerAnalytics: {
          totalImpressions: bannerSection.totalViews,
          clickThroughRate: bannerSection.interactionRate,
          bannerPerformance: bannerSection.topElements?.map(el => ({
            bannerId: el.elementId,
            impressions: bannerSection.totalViews,
            clicks: el.interactions,
            ctr: bannerSection.totalViews > 0 ? (el.interactions / bannerSection.totalViews) * 100 : 0
          })) || []
        },
        communityAnalytics: {
          spotlightViews: communitySection.totalViews,
          testimonialEngagement: communitySection.interactionRate,
          communityInteractionRate: communitySection.interactionRate
        },
        quoteAnalytics: {
          rotationEffectiveness: quoteSection.interactionRate,
          quoteEngagementRate: quoteSection.interactionRate,
          averageViewTime: 0 // Simplified for basic implementation
        }
      };
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error);
      // Return empty structure on error
      const emptySummary: AnalyticsSummary = {
        totalPageViews: 0,
        totalUniqueVisitors: 0,
        averageBounceRate: 0,
        averageTimeOnPage: 0,
        totalChatClicks: 0,
        totalCarouselInteractions: 0,
        totalBannerClicks: 0,
        returnVisitorRate: 0,
        averageSessionDuration: 0,
        mobileVsDesktopRatio: { mobile: 0, desktop: 0 },
        period: `${days} days`
      };

      return {
        summary: emptySummary,
        sectionBreakdown: [],
        heroAnalytics: { customQuoteViews: 0, chatButtonClickRate: 0, heroEngagementRate: 0 },
        carouselAnalytics: { totalBookClicks: 0, carouselInteractionRate: 0, mostPopularBooks: [] },
        bannerAnalytics: { totalImpressions: 0, clickThroughRate: 0, bannerPerformance: [] },
        communityAnalytics: { spotlightViews: 0, testimonialEngagement: 0, communityInteractionRate: 0 },
        quoteAnalytics: { rotationEffectiveness: 0, quoteEngagementRate: 0, averageViewTime: 0 }
      };
    }
  }
}
