/**
 * Performance Alerts Module
 * 
 * Handles generation of performance alerts and warnings
 */

import { getEnhancedSummary } from './summary-analytics';
import type { PerformanceAlert } from './types';

/**
 * Generate basic performance alerts based on analytics data
 */
export async function getPerformanceAlerts(storeId: string): Promise<PerformanceAlert[]> {
  try {
    const summary = await getEnhancedSummary(storeId, 30);
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
 * Generate traffic-specific alerts
 */
export async function getTrafficAlerts(storeId: string): Promise<PerformanceAlert[]> {
  try {
    const summary = await getEnhancedSummary(storeId, 30);
    const alerts: PerformanceAlert[] = [];

    // Low traffic alert
    if (summary.totalPageViews < 50) {
      alerts.push({
        type: 'warning',
        title: 'Low Traffic Volume',
        message: `Only ${summary.totalPageViews} page views in the last 30 days.`,
        recommendation: 'Consider promoting your landing page through social media or local marketing.',
        priority: 'high'
      });
    }

    // High traffic, low conversion
    if (summary.totalPageViews > 200 && summary.totalChatClicks < 10) {
      alerts.push({
        type: 'warning',
        title: 'High Traffic, Low Conversion',
        message: 'You have good traffic but low engagement with the chat feature.',
        recommendation: 'Optimize your call-to-action buttons and improve content relevance.',
        priority: 'high'
      });
    }

    // Mobile vs desktop imbalance
    if (summary.mobileVsDesktopRatio.mobile > 80) {
      alerts.push({
        type: 'info',
        title: 'Primarily Mobile Traffic',
        message: `${summary.mobileVsDesktopRatio.mobile}% of your traffic is from mobile devices.`,
        recommendation: 'Ensure your landing page is fully optimized for mobile experience.',
        priority: 'medium'
      });
    }

    // Good traffic growth
    if (summary.totalPageViews > 500) {
      alerts.push({
        type: 'success',
        title: 'Strong Traffic Performance',
        message: `Excellent traffic with ${summary.totalPageViews} page views this month.`,
        recommendation: 'Focus on converting this traffic into meaningful engagements.',
        priority: 'low'
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error generating traffic alerts:', error);
    return [];
  }
}

/**
 * Generate engagement-specific alerts
 */
export async function getEngagementAlerts(storeId: string): Promise<PerformanceAlert[]> {
  try {
    const summary = await getEnhancedSummary(storeId, 30);
    const alerts: PerformanceAlert[] = [];

    const totalInteractions = summary.totalChatClicks + 
                             summary.totalCarouselInteractions + 
                             summary.totalBannerClicks;
    
    const engagementRate = summary.totalPageViews > 0 ? 
      (totalInteractions / summary.totalPageViews) * 100 : 0;

    // Low overall engagement
    if (engagementRate < 10 && summary.totalPageViews > 50) {
      alerts.push({
        type: 'warning',
        title: 'Low Overall Engagement',
        message: `Engagement rate is only ${engagementRate.toFixed(1)}%.`,
        recommendation: 'Review your content strategy and make interactive elements more prominent.',
        priority: 'high'
      });
    }

    // Banner underperformance
    if (summary.totalBannerClicks === 0 && summary.totalPageViews > 100) {
      alerts.push({
        type: 'info',
        title: 'Banners Not Performing',
        message: 'Your promotional banners are not getting any clicks.',
        recommendation: 'Review banner content, placement, and call-to-action effectiveness.',
        priority: 'medium'
      });
    }

    // Carousel underperformance
    if (summary.totalCarouselInteractions < 5 && summary.totalPageViews > 100) {
      alerts.push({
        type: 'info',
        title: 'Carousel Needs Improvement',
        message: 'Book carousel has very low interaction rates.',
        recommendation: 'Update featured books, improve descriptions, or enhance visual appeal.',
        priority: 'medium'
      });
    }

    // High engagement success
    if (engagementRate > 25) {
      alerts.push({
        type: 'success',
        title: 'Excellent Engagement!',
        message: `Outstanding engagement rate of ${engagementRate.toFixed(1)}%.`,
        recommendation: 'Your content strategy is working well. Consider scaling successful elements.',
        priority: 'low'
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error generating engagement alerts:', error);
    return [];
  }
}

/**
 * Generate time-based alerts
 */
export async function getTimeBasedAlerts(storeId: string): Promise<PerformanceAlert[]> {
  try {
    const summary = await getEnhancedSummary(storeId, 30);
    const alerts: PerformanceAlert[] = [];

    // Short session duration
    if (summary.averageSessionDuration < 30 && summary.totalPageViews > 50) {
      alerts.push({
        type: 'warning',
        title: 'Short Session Duration',
        message: `Average session duration is only ${summary.averageSessionDuration} seconds.`,
        recommendation: 'Add more engaging content to keep visitors on your page longer.',
        priority: 'medium'
      });
    }

    // Low time on page
    if (summary.averageTimeOnPage < 20 && summary.totalPageViews > 50) {
      alerts.push({
        type: 'warning',
        title: 'Low Time on Page',
        message: `Visitors spend only ${summary.averageTimeOnPage} seconds on average.`,
        recommendation: 'Improve content quality and page layout to increase engagement time.',
        priority: 'medium'
      });
    }

    // Good retention
    if (summary.averageSessionDuration > 120) {
      alerts.push({
        type: 'success',
        title: 'Great User Retention',
        message: `Visitors spend an average of ${Math.round(summary.averageSessionDuration / 60)} minutes on your page.`,
        recommendation: 'Your content is engaging. Consider adding more interactive elements.',
        priority: 'low'
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error generating time-based alerts:', error);
    return [];
  }
}

/**
 * Get all alerts categorized by type
 */
export async function getAllAlerts(storeId: string): Promise<{
  performance: PerformanceAlert[];
  traffic: PerformanceAlert[];
  engagement: PerformanceAlert[];
  timeBased: PerformanceAlert[];
  all: PerformanceAlert[];
}> {
  try {
    const [performance, traffic, engagement, timeBased] = await Promise.all([
      getPerformanceAlerts(storeId),
      getTrafficAlerts(storeId),
      getEngagementAlerts(storeId),
      getTimeBasedAlerts(storeId)
    ]);

    const all = [...performance, ...traffic, ...engagement, ...timeBased];

    return {
      performance,
      traffic,
      engagement,
      timeBased,
      all
    };
  } catch (error) {
    console.error('Error getting all alerts:', error);
    return {
      performance: [],
      traffic: [],
      engagement: [],
      timeBased: [],
      all: []
    };
  }
}

/**
 * Get priority alerts only
 */
export async function getPriorityAlerts(storeId: string, priority: 'high' | 'medium' | 'low' = 'high'): Promise<PerformanceAlert[]> {
  try {
    const { all } = await getAllAlerts(storeId);
    return all.filter(alert => alert.priority === priority);
  } catch (error) {
    console.error('Error getting priority alerts:', error);
    return [];
  }
}
