/**
 * Metrics Collection Module
 * 
 * Handles basic metrics gathering and data collection
 */

import { supabase } from '@/lib/supabase';
import type { AnalyticsSummary, AnalyticsQueryOptions, AnalyticsEvent } from './types';

/**
 * Get basic analytics summary for a store
 */
export async function getAnalyticsSummary(storeId: string, days: number = 30): Promise<AnalyticsSummary> {
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
    const pageLoads = analytics.filter((event: AnalyticsEvent) => event.event_type === 'page_load');
    const chatClicks = analytics.filter((event: AnalyticsEvent) => event.event_type === 'chat_button_click');
    const carouselInteractions = analytics.filter((event: AnalyticsEvent) => event.event_type === 'carousel_click');
    const bannerClicks = analytics.filter((event: AnalyticsEvent) => event.event_type === 'banner_click');

    // Calculate unique sessions and visitors
    const uniqueSessions = new Set(analytics.map((event: AnalyticsEvent) => event.session_id)).size;
    const uniqueVisitors = new Set(analytics.map((event: AnalyticsEvent) => event.user_id).filter(Boolean)).size;

    // Calculate mobile vs desktop ratio
    const mobileEvents = analytics.filter((event: AnalyticsEvent) =>
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
      returnVisitorRate: 0,
      averageSessionDuration: 0,
      mobileVsDesktopRatio: { mobile: 0, desktop: 0 },
      period: `${days} days`
    };
  }
}

/**
 * Get analytics data for a specific time period
 */
export async function getAnalyticsData(options: AnalyticsQueryOptions): Promise<AnalyticsEvent[]> {
  try {
    const { storeId, days = 30, startDate, endDate, eventTypes, sections } = options;
    
    let query = supabase
      .from('store_landing_analytics')
      .select('*')
      .eq('store_id', storeId);

    // Add time range filters
    if (startDate && endDate) {
      query = query.gte('timestamp', startDate).lte('timestamp', endDate);
    } else if (days) {
      const start = new Date();
      start.setDate(start.getDate() - days);
      query = query.gte('timestamp', start.toISOString());
    }

    // Add event type filters
    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }

    // Add section filters
    if (sections && sections.length > 0) {
      query = query.in('section_name', sections);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return [];
  }
}

/**
 * Get event counts by type
 */
export async function getEventCounts(storeId: string, days: number = 30): Promise<Record<string, number>> {
  try {
    const analytics = await getAnalyticsData({ storeId, days });
    
    const eventCounts: Record<string, number> = {};
    analytics.forEach((event: AnalyticsEvent) => {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    });

    return eventCounts;
  } catch (error) {
    console.error('Error getting event counts:', error);
    return {};
  }
}

/**
 * Get unique session count
 */
export async function getUniqueSessionCount(storeId: string, days: number = 30): Promise<number> {
  try {
    const analytics = await getAnalyticsData({ storeId, days });
    const uniqueSessions = new Set(analytics.map((event: AnalyticsEvent) => event.session_id));
    return uniqueSessions.size;
  } catch (error) {
    console.error('Error getting unique session count:', error);
    return 0;
  }
}

/**
 * Get unique visitor count
 */
export async function getUniqueVisitorCount(storeId: string, days: number = 30): Promise<number> {
  try {
    const analytics = await getAnalyticsData({ storeId, days });
    const uniqueVisitors = new Set(analytics.map((event: AnalyticsEvent) => event.user_id).filter(Boolean));
    return uniqueVisitors.size;
  } catch (error) {
    console.error('Error getting unique visitor count:', error);
    return 0;
  }
}

/**
 * Calculate bounce rate based on session behavior
 */
export async function calculateBounceRate(storeId: string, days: number = 30): Promise<number> {
  try {
    const analytics = await getAnalyticsData({ storeId, days });
    
    // Group events by session
    const sessionEvents: Record<string, AnalyticsEvent[]> = {};
    analytics.forEach((event: AnalyticsEvent) => {
      if (event.session_id) {
        if (!sessionEvents[event.session_id]) {
          sessionEvents[event.session_id] = [];
        }
        sessionEvents[event.session_id].push(event);
      }
    });

    // Calculate bounce rate (sessions with only one interaction)
    const totalSessions = Object.keys(sessionEvents).length;
    if (totalSessions === 0) return 0;

    const bouncedSessions = Object.values(sessionEvents).filter(events => events.length <= 1).length;
    return Math.round((bouncedSessions / totalSessions) * 100);
  } catch (error) {
    console.error('Error calculating bounce rate:', error);
    return 0;
  }
}

/**
 * Get time series data for analytics visualization
 */
export async function getTimeSeriesData(
  storeId: string, 
  days: number = 30, 
  eventType?: string
): Promise<Array<{ date: string; count: number }>> {
  try {
    const options: AnalyticsQueryOptions = { storeId, days };
    if (eventType) {
      options.eventTypes = [eventType];
    }

    const analytics = await getAnalyticsData(options);
    
    // Group events by date
    const dateGroups: Record<string, number> = {};
    analytics.forEach((event: AnalyticsEvent) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    // Convert to time series format
    return Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting time series data:', error);
    return [];
  }
}
