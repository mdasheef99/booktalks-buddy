/**
 * Dashboard Statistics Hook
 * 
 * Handles calculation and management of dashboard statistics
 */

import { useMemo } from 'react';
import type { DashboardData, DashboardStats } from '../types';

/**
 * Hook to calculate dashboard statistics from data
 */
export function useDashboardStats(data: DashboardData): DashboardStats {
  return useMemo(() => {
    const {
      carouselItems,
      banners,
      quotes,
      showcaseData,
      heroCustomization
    } = data;

    return {
      carousel: {
        total: carouselItems.length,
        active: carouselItems.filter((item: any) => item.is_active).length,
        max: 6
      },
      banners: {
        total: banners.length,
        active: banners.filter((banner: any) => banner.is_active).length
      },
      quotes: {
        total: quotes.length,
        active: quotes.filter((quote: any) => quote.is_active).length
      },
      community: {
        spotlights: showcaseData?.memberSpotlights?.length || 0,
        testimonials: showcaseData?.testimonials?.length || 0,
        activities: showcaseData?.activityFeed?.length || 0
      },
      hero: {
        hasCustomQuote: !!(heroCustomization?.sections_enabled?.hero_quote && heroCustomization?.hero_quote),
        chatButtonEnabled: heroCustomization?.is_chat_button_enabled || false
      }
    };
  }, [data]);
}

/**
 * Hook to get specific statistics with computed values
 */
export function useEnhancedDashboardStats(data: DashboardData) {
  const baseStats = useDashboardStats(data);

  return useMemo(() => {
    const { carousel, banners, quotes, community, hero } = baseStats;

    // Calculate completion percentage
    const totalSections = 5; // hero, carousel, banners, quotes, community
    let completedSections = 0;

    if (hero.hasCustomQuote) completedSections++;
    if (carousel.active > 0) completedSections++;
    if (banners.active > 0) completedSections++;
    if (quotes.active > 0) completedSections++;
    if (community.spotlights > 0) completedSections++;

    const completionPercentage = Math.round((completedSections / totalSections) * 100);

    // Calculate content health score
    const maxCarouselScore = 20; // 6 books max, ~3.33 points each
    const maxBannerScore = 20;   // Assume 4 banners max, 5 points each
    const maxQuoteScore = 20;    // Assume 10 quotes max, 2 points each
    const maxCommunityScore = 20; // Assume 5 spotlights max, 4 points each
    const maxHeroScore = 20;     // Custom quote + chat button

    const carouselScore = Math.min((carousel.active / 6) * maxCarouselScore, maxCarouselScore);
    const bannerScore = Math.min((banners.active / 4) * maxBannerScore, maxBannerScore);
    const quoteScore = Math.min((quotes.active / 10) * maxQuoteScore, maxQuoteScore);
    const communityScore = Math.min((community.spotlights / 5) * maxCommunityScore, maxCommunityScore);
    const heroScore = (hero.hasCustomQuote ? 15 : 0) + (hero.chatButtonEnabled ? 5 : 0);

    const healthScore = Math.round(carouselScore + bannerScore + quoteScore + communityScore + heroScore);

    // Determine health grade
    let healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (healthScore >= 90) healthGrade = 'A';
    else if (healthScore >= 80) healthGrade = 'B';
    else if (healthScore >= 70) healthGrade = 'C';
    else if (healthScore >= 60) healthGrade = 'D';
    else healthGrade = 'F';

    // Calculate priority actions needed
    const priorityActions: string[] = [];
    if (!hero.hasCustomQuote) priorityActions.push('Add custom hero quote');
    if (carousel.active === 0) priorityActions.push('Add books to carousel');
    if (banners.active === 0) priorityActions.push('Create promotional banners');
    if (quotes.active === 0) priorityActions.push('Add inspirational quotes');
    if (community.spotlights === 0) priorityActions.push('Feature community members');

    return {
      ...baseStats,
      computed: {
        completionPercentage,
        healthScore,
        healthGrade,
        priorityActions,
        isFullyConfigured: completedSections === totalSections,
        sectionsCompleted: completedSections,
        totalSections,
        scores: {
          carousel: Math.round(carouselScore),
          banners: Math.round(bannerScore),
          quotes: Math.round(quoteScore),
          community: Math.round(communityScore),
          hero: Math.round(heroScore)
        }
      }
    };
  }, [baseStats]);
}

/**
 * Hook to get statistics trends (would require historical data)
 */
export function useDashboardStatsTrends(data: DashboardData) {
  // This would typically compare current stats with previous periods
  // For now, we'll return mock trend data
  return useMemo(() => {
    const stats = useDashboardStats(data);

    return {
      carousel: {
        current: stats.carousel.active,
        trend: 'stable' as const,
        change: 0
      },
      banners: {
        current: stats.banners.active,
        trend: 'stable' as const,
        change: 0
      },
      quotes: {
        current: stats.quotes.active,
        trend: 'stable' as const,
        change: 0
      },
      community: {
        current: stats.community.spotlights,
        trend: 'stable' as const,
        change: 0
      }
    };
  }, [data]);
}

/**
 * Hook to get actionable insights based on statistics
 */
export function useDashboardInsights(data: DashboardData) {
  const enhancedStats = useEnhancedDashboardStats(data);

  return useMemo(() => {
    const insights: Array<{
      type: 'success' | 'warning' | 'info';
      title: string;
      message: string;
      action?: string;
    }> = [];

    const { computed, carousel, banners, quotes, community, hero } = enhancedStats;

    // Success insights
    if (computed.isFullyConfigured) {
      insights.push({
        type: 'success',
        title: 'Fully Configured!',
        message: 'All sections are set up and active. Your landing page is ready to engage visitors.',
        action: 'View Analytics'
      });
    }

    if (computed.healthScore >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Setup',
        message: `Your content health score is ${computed.healthScore}/100 (Grade ${computed.healthGrade}).`
      });
    }

    // Warning insights
    if (carousel.active === 0) {
      insights.push({
        type: 'warning',
        title: 'Empty Carousel',
        message: 'Your book carousel is empty. Add featured books to showcase your collection.',
        action: 'Add Books'
      });
    }

    if (computed.healthScore < 60) {
      insights.push({
        type: 'warning',
        title: 'Low Content Health',
        message: `Your content health score is ${computed.healthScore}/100. Consider adding more content.`,
        action: 'Improve Content'
      });
    }

    // Info insights
    if (carousel.active >= carousel.max) {
      insights.push({
        type: 'info',
        title: 'Carousel Full',
        message: 'Your carousel is at maximum capacity. Consider rotating featured books regularly.'
      });
    }

    if (computed.completionPercentage >= 60 && computed.completionPercentage < 100) {
      insights.push({
        type: 'info',
        title: 'Almost Complete',
        message: `You're ${computed.completionPercentage}% done setting up your landing page.`,
        action: 'Complete Setup'
      });
    }

    return insights;
  }, [enhancedStats]);
}
