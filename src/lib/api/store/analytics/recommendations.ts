/**
 * Recommendations Module
 * 
 * Handles generation of improvement recommendations
 */

import { getEnhancedSummary } from './summary-analytics';
import { getSectionAnalytics } from './section-analytics';
import type { BasicRecommendation } from './types';

/**
 * Generate basic recommendations for store improvement
 */
export async function getBasicRecommendations(storeId: string): Promise<BasicRecommendation[]> {
  try {
    const summary = await getEnhancedSummary(storeId, 30);
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
 * Generate content-specific recommendations
 */
export async function getContentRecommendations(storeId: string): Promise<BasicRecommendation[]> {
  try {
    const [summary, sections] = await Promise.all([
      getEnhancedSummary(storeId, 30),
      getSectionAnalytics(storeId, 30)
    ]);

    const recommendations: BasicRecommendation[] = [];

    // Carousel recommendations
    const carouselSection = sections.find(s => s.sectionName === 'carousel');
    if (carouselSection && carouselSection.interactionRate < 15) {
      recommendations.push({
        category: 'content',
        title: 'Enhance Book Carousel',
        description: `Carousel interaction rate is ${carouselSection.interactionRate.toFixed(1)}%.`,
        action: 'Feature bestsellers, add book descriptions, or improve visual design',
        impact: 'high'
      });
    }

    // Banner recommendations
    const bannerSection = sections.find(s => s.sectionName === 'banners');
    if (bannerSection && bannerSection.interactionRate < 5) {
      recommendations.push({
        category: 'content',
        title: 'Improve Banner Content',
        description: 'Promotional banners are not generating clicks.',
        action: 'Create more compelling offers or improve banner design',
        impact: 'medium'
      });
    }

    // Hero section recommendations
    const heroSection = sections.find(s => s.sectionName === 'hero');
    if (heroSection && heroSection.interactionRate < 10) {
      recommendations.push({
        category: 'content',
        title: 'Optimize Hero Section',
        description: 'Hero section needs more engaging content.',
        action: 'Add compelling headlines, better imagery, or clear value propositions',
        impact: 'high'
      });
    }

    // Community section recommendations
    const communitySection = sections.find(s => s.sectionName === 'community');
    if (communitySection && communitySection.totalViews < summary.totalPageViews * 0.3) {
      recommendations.push({
        category: 'content',
        title: 'Boost Community Section',
        description: 'Community section is not getting enough attention.',
        action: 'Add customer testimonials, book reviews, or community highlights',
        impact: 'medium'
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating content recommendations:', error);
    return [];
  }
}

/**
 * Generate engagement-focused recommendations
 */
export async function getEngagementRecommendations(storeId: string): Promise<BasicRecommendation[]> {
  try {
    const summary = await getEnhancedSummary(storeId, 30);
    const recommendations: BasicRecommendation[] = [];

    const totalInteractions = summary.totalChatClicks + 
                             summary.totalCarouselInteractions + 
                             summary.totalBannerClicks;
    
    const engagementRate = summary.totalPageViews > 0 ? 
      (totalInteractions / summary.totalPageViews) * 100 : 0;

    // Low chat engagement
    if (summary.totalPageViews > 50 && summary.totalChatClicks < 5) {
      recommendations.push({
        category: 'engagement',
        title: 'Improve Chat Button Visibility',
        description: 'Chat button is not getting enough clicks.',
        action: 'Make chat button more prominent, add hover effects, or change positioning',
        impact: 'high'
      });
    }

    // Overall low engagement
    if (engagementRate < 15 && summary.totalPageViews > 100) {
      recommendations.push({
        category: 'engagement',
        title: 'Increase Overall Engagement',
        description: `Overall engagement rate is only ${engagementRate.toFixed(1)}%.`,
        action: 'Add interactive elements, improve call-to-action buttons, or gamify the experience',
        impact: 'high'
      });
    }

    // Mobile engagement issues
    if (summary.mobileVsDesktopRatio.mobile > 70 && engagementRate < 20) {
      recommendations.push({
        category: 'engagement',
        title: 'Optimize Mobile Experience',
        description: 'Mobile users are not engaging well with your content.',
        action: 'Improve mobile layout, button sizes, and touch interactions',
        impact: 'high'
      });
    }

    // Session duration improvement
    if (summary.averageSessionDuration < 60) {
      recommendations.push({
        category: 'engagement',
        title: 'Extend Session Duration',
        description: 'Users are leaving too quickly.',
        action: 'Add engaging content, improve page flow, or create interactive elements',
        impact: 'medium'
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating engagement recommendations:', error);
    return [];
  }
}

/**
 * Generate performance-focused recommendations
 */
export async function getPerformanceRecommendations(storeId: string): Promise<BasicRecommendation[]> {
  try {
    const summary = await getEnhancedSummary(storeId, 30);
    const recommendations: BasicRecommendation[] = [];

    // High bounce rate
    if (summary.averageBounceRate > 70) {
      recommendations.push({
        category: 'performance',
        title: 'Reduce Bounce Rate',
        description: `Bounce rate is ${summary.averageBounceRate.toFixed(1)}%, which is too high.`,
        action: 'Improve page loading speed, enhance content relevance, or fix navigation issues',
        impact: 'high'
      });
    }

    // Low return visitor rate
    if (summary.returnVisitorRate < 10 && summary.totalPageViews > 100) {
      recommendations.push({
        category: 'performance',
        title: 'Increase Return Visitors',
        description: 'Few visitors are returning to your page.',
        action: 'Create compelling content, add newsletter signup, or implement loyalty features',
        impact: 'medium'
      });
    }

    // Traffic growth opportunities
    if (summary.totalPageViews < 200) {
      recommendations.push({
        category: 'performance',
        title: 'Increase Traffic Volume',
        description: 'Your page needs more visitors to maximize impact.',
        action: 'Implement SEO improvements, social media marketing, or local advertising',
        impact: 'high'
      });
    }

    // Conversion optimization
    const conversionRate = summary.totalPageViews > 0 ? 
      (summary.totalChatClicks / summary.totalPageViews) * 100 : 0;
    
    if (conversionRate < 5 && summary.totalPageViews > 100) {
      recommendations.push({
        category: 'performance',
        title: 'Improve Conversion Rate',
        description: `Conversion rate is only ${conversionRate.toFixed(1)}%.`,
        action: 'Optimize call-to-action placement, improve value proposition, or simplify user flow',
        impact: 'high'
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating performance recommendations:', error);
    return [];
  }
}

/**
 * Get prioritized recommendations
 */
export async function getPrioritizedRecommendations(storeId: string): Promise<{
  high: BasicRecommendation[];
  medium: BasicRecommendation[];
  low: BasicRecommendation[];
  all: BasicRecommendation[];
}> {
  try {
    const [content, engagement, performance] = await Promise.all([
      getContentRecommendations(storeId),
      getEngagementRecommendations(storeId),
      getPerformanceRecommendations(storeId)
    ]);

    const all = [...content, ...engagement, ...performance];
    
    return {
      high: all.filter(rec => rec.impact === 'high'),
      medium: all.filter(rec => rec.impact === 'medium'),
      low: all.filter(rec => rec.impact === 'low'),
      all
    };
  } catch (error) {
    console.error('Error getting prioritized recommendations:', error);
    return {
      high: [],
      medium: [],
      low: [],
      all: []
    };
  }
}

/**
 * Get recommendations by category
 */
export async function getRecommendationsByCategory(storeId: string): Promise<{
  content: BasicRecommendation[];
  engagement: BasicRecommendation[];
  performance: BasicRecommendation[];
}> {
  try {
    const [content, engagement, performance] = await Promise.all([
      getContentRecommendations(storeId),
      getEngagementRecommendations(storeId),
      getPerformanceRecommendations(storeId)
    ]);

    return {
      content,
      engagement,
      performance
    };
  } catch (error) {
    console.error('Error getting recommendations by category:', error);
    return {
      content: [],
      engagement: [],
      performance: []
    };
  }
}
