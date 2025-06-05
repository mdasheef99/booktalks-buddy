/**
 * Enhanced Analytics Module
 * 
 * Handles enhanced analytics with detailed breakdowns
 */

import { getEnhancedSummary } from './summary-analytics';
import { getSectionAnalytics } from './section-analytics';
import type { EnhancedAnalytics, AnalyticsSummary } from './types';

/**
 * Get enhanced analytics with section breakdown
 */
export async function getEnhancedAnalytics(storeId: string, days: number = 30): Promise<EnhancedAnalytics> {
  try {
    const [summary, sectionBreakdown] = await Promise.all([
      getEnhancedSummary(storeId, days),
      getSectionAnalytics(storeId, days)
    ]);

    // Get section-specific data
    const heroSection = sectionBreakdown.find(s => s.sectionName === 'hero') || { 
      totalViews: 0, 
      interactionRate: 0 
    };
    
    const carouselSection = sectionBreakdown.find(s => s.sectionName === 'carousel') || { 
      totalViews: 0, 
      interactionRate: 0, 
      topElements: [] 
    };
    
    const bannerSection = sectionBreakdown.find(s => s.sectionName === 'banners') || { 
      totalViews: 0, 
      interactionRate: 0, 
      topElements: [] 
    };
    
    const communitySection = sectionBreakdown.find(s => s.sectionName === 'community') || { 
      totalViews: 0, 
      interactionRate: 0 
    };
    
    const quoteSection = sectionBreakdown.find(s => s.sectionName === 'quote') || { 
      totalViews: 0, 
      interactionRate: 0 
    };

    return {
      summary,
      sectionBreakdown,
      heroAnalytics: {
        customQuoteViews: heroSection.totalViews,
        chatButtonClickRate: summary.totalPageViews > 0 ? 
          (summary.totalChatClicks / summary.totalPageViews) * 100 : 0,
        heroEngagementRate: heroSection.interactionRate
      },
      carouselAnalytics: {
        totalBookClicks: summary.totalCarouselInteractions,
        carouselInteractionRate: carouselSection.interactionRate,
        mostPopularBooks: carouselSection.topElements?.map((el: any) => ({
          bookTitle: `Book ${el.elementId}`, // Simplified - would need book title lookup
          clicks: el.interactions
        })) || []
      },
      bannerAnalytics: {
        totalImpressions: bannerSection.totalViews,
        clickThroughRate: bannerSection.interactionRate,
        bannerPerformance: bannerSection.topElements?.map((el: any) => ({
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

/**
 * Get detailed hero section analytics
 */
export async function getHeroAnalytics(storeId: string, days: number = 30): Promise<{
  totalViews: number;
  chatButtonClicks: number;
  chatButtonClickRate: number;
  quoteViews: number;
  heroEngagementRate: number;
  averageTimeSpent: number;
}> {
  try {
    const enhanced = await getEnhancedAnalytics(storeId, days);
    
    return {
      totalViews: enhanced.heroAnalytics.customQuoteViews,
      chatButtonClicks: enhanced.summary.totalChatClicks,
      chatButtonClickRate: enhanced.heroAnalytics.chatButtonClickRate,
      quoteViews: enhanced.heroAnalytics.customQuoteViews,
      heroEngagementRate: enhanced.heroAnalytics.heroEngagementRate,
      averageTimeSpent: enhanced.summary.averageTimeOnPage
    };
  } catch (error) {
    console.error('Error getting hero analytics:', error);
    return {
      totalViews: 0,
      chatButtonClicks: 0,
      chatButtonClickRate: 0,
      quoteViews: 0,
      heroEngagementRate: 0,
      averageTimeSpent: 0
    };
  }
}

/**
 * Get detailed carousel analytics
 */
export async function getCarouselAnalytics(storeId: string, days: number = 30): Promise<{
  totalInteractions: number;
  interactionRate: number;
  mostPopularBooks: Array<{ bookTitle: string; clicks: number; clickRate: number }>;
  averageClicksPerBook: number;
  carouselViewTime: number;
}> {
  try {
    const enhanced = await getEnhancedAnalytics(storeId, days);
    const carousel = enhanced.carouselAnalytics;
    
    const totalBooks = carousel.mostPopularBooks.length;
    const averageClicksPerBook = totalBooks > 0 ? 
      carousel.mostPopularBooks.reduce((sum, book) => sum + book.clicks, 0) / totalBooks : 0;

    const booksWithRates = carousel.mostPopularBooks.map(book => ({
      ...book,
      clickRate: enhanced.summary.totalPageViews > 0 ? 
        (book.clicks / enhanced.summary.totalPageViews) * 100 : 0
    }));

    return {
      totalInteractions: carousel.totalBookClicks,
      interactionRate: carousel.carouselInteractionRate,
      mostPopularBooks: booksWithRates,
      averageClicksPerBook: Math.round(averageClicksPerBook),
      carouselViewTime: 0 // Simplified
    };
  } catch (error) {
    console.error('Error getting carousel analytics:', error);
    return {
      totalInteractions: 0,
      interactionRate: 0,
      mostPopularBooks: [],
      averageClicksPerBook: 0,
      carouselViewTime: 0
    };
  }
}

/**
 * Get detailed banner analytics
 */
export async function getBannerAnalytics(storeId: string, days: number = 30): Promise<{
  totalImpressions: number;
  totalClicks: number;
  overallClickThroughRate: number;
  bannerPerformance: Array<{
    bannerId: string;
    impressions: number;
    clicks: number;
    ctr: number;
    performance: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  topPerformingBanner: string;
}> {
  try {
    const enhanced = await getEnhancedAnalytics(storeId, days);
    const banner = enhanced.bannerAnalytics;
    
    const enhancedBannerPerformance = banner.bannerPerformance.map(b => {
      let performance: 'excellent' | 'good' | 'average' | 'poor';
      if (b.ctr >= 10) performance = 'excellent';
      else if (b.ctr >= 5) performance = 'good';
      else if (b.ctr >= 2) performance = 'average';
      else performance = 'poor';

      return { ...b, performance };
    });

    const topBanner = enhancedBannerPerformance.reduce((prev, current) => 
      current.ctr > prev.ctr ? current : prev, 
      enhancedBannerPerformance[0] || { bannerId: 'None', ctr: 0 }
    );

    return {
      totalImpressions: banner.totalImpressions,
      totalClicks: enhanced.summary.totalBannerClicks,
      overallClickThroughRate: banner.clickThroughRate,
      bannerPerformance: enhancedBannerPerformance,
      topPerformingBanner: topBanner.bannerId
    };
  } catch (error) {
    console.error('Error getting banner analytics:', error);
    return {
      totalImpressions: 0,
      totalClicks: 0,
      overallClickThroughRate: 0,
      bannerPerformance: [],
      topPerformingBanner: 'None'
    };
  }
}

/**
 * Get community section analytics
 */
export async function getCommunityAnalytics(storeId: string, days: number = 30): Promise<{
  spotlightViews: number;
  testimonialEngagement: number;
  communityInteractionRate: number;
  socialProofEffectiveness: number;
  communityGrowthRate: number;
}> {
  try {
    const enhanced = await getEnhancedAnalytics(storeId, days);
    const community = enhanced.communityAnalytics;
    
    // Calculate social proof effectiveness (simplified)
    const socialProofEffectiveness = community.communityInteractionRate > 15 ? 
      Math.min(community.communityInteractionRate * 2, 100) : community.communityInteractionRate;

    return {
      spotlightViews: community.spotlightViews,
      testimonialEngagement: community.testimonialEngagement,
      communityInteractionRate: community.communityInteractionRate,
      socialProofEffectiveness,
      communityGrowthRate: 0 // Would need historical data
    };
  } catch (error) {
    console.error('Error getting community analytics:', error);
    return {
      spotlightViews: 0,
      testimonialEngagement: 0,
      communityInteractionRate: 0,
      socialProofEffectiveness: 0,
      communityGrowthRate: 0
    };
  }
}

/**
 * Get comprehensive analytics dashboard data
 */
export async function getAnalyticsDashboard(storeId: string, days: number = 30): Promise<{
  overview: AnalyticsSummary;
  hero: any;
  carousel: any;
  banner: any;
  community: any;
  topSections: Array<{ name: string; score: number }>;
  overallScore: number;
}> {
  try {
    const [enhanced, hero, carousel, banner, community] = await Promise.all([
      getEnhancedAnalytics(storeId, days),
      getHeroAnalytics(storeId, days),
      getCarouselAnalytics(storeId, days),
      getBannerAnalytics(storeId, days),
      getCommunityAnalytics(storeId, days)
    ]);

    // Calculate section scores
    const sectionScores = [
      { name: 'Hero', score: hero.heroEngagementRate },
      { name: 'Carousel', score: carousel.interactionRate },
      { name: 'Banners', score: banner.overallClickThroughRate },
      { name: 'Community', score: community.communityInteractionRate }
    ].sort((a, b) => b.score - a.score);

    // Calculate overall score
    const overallScore = Math.round(
      sectionScores.reduce((sum, section) => sum + section.score, 0) / sectionScores.length
    );

    return {
      overview: enhanced.summary,
      hero,
      carousel,
      banner,
      community,
      topSections: sectionScores,
      overallScore
    };
  } catch (error) {
    console.error('Error getting analytics dashboard:', error);
    throw error;
  }
}
