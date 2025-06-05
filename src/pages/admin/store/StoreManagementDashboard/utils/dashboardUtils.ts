/**
 * Dashboard Utilities
 * 
 * Utility functions for dashboard data processing and configuration
 */

import {
  BookOpen,
  Megaphone,
  Quote,
  Users,
  Type
} from 'lucide-react';
import type { DashboardStats, QuickAction, ManagementSection } from '../types';

/**
 * Create quick action items based on current stats
 */
export function createQuickActions(stats: DashboardStats): QuickAction[] {
  return [
    {
      title: 'Customize Hero',
      description: 'Add custom quote and chat button',
      icon: Type,
      href: '/admin/store-management/hero',
      disabled: false,
      color: 'bg-indigo-500'
    },
    {
      title: 'Add Book to Carousel',
      description: 'Feature a new book in your carousel',
      icon: BookOpen,
      href: '/admin/store-management/carousel',
      disabled: stats.carousel.total >= 6,
      color: 'bg-blue-500'
    },
    {
      title: 'Create Banner',
      description: 'Add a promotional banner',
      icon: Megaphone,
      href: '/admin/store-management/banners',
      disabled: false,
      color: 'bg-orange-500'
    },
    {
      title: 'Add Quote',
      description: 'Create an inspirational quote',
      icon: Quote,
      href: '/admin/store-management/quotes',
      disabled: false,
      color: 'bg-green-500'
    },
    {
      title: 'Manage Community',
      description: 'Configure community showcase',
      icon: Users,
      href: '/admin/store-management/community',
      disabled: false,
      color: 'bg-purple-500'
    }
  ];
}

/**
 * Create management sections with current stats
 */
export function createManagementSections(stats: DashboardStats): ManagementSection[] {
  return [
    {
      title: 'Hero Customization',
      description: 'Customize hero section quotes and chat button',
      icon: Type,
      href: '/admin/store-management/hero',
      stats: stats.hero.hasCustomQuote ? 'Custom quote active' : 'Using defaults',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Carousel Management',
      description: 'Manage your featured books carousel',
      icon: BookOpen,
      href: '/admin/store-management/carousel',
      stats: `${stats.carousel.active}/${stats.carousel.max} books`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Banner Management',
      description: 'Create and manage promotional banners',
      icon: Megaphone,
      href: '/admin/store-management/banners',
      stats: `${stats.banners.active} active banners`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Quote Management',
      description: 'Manage inspirational quotes',
      icon: Quote,
      href: '/admin/store-management/quotes',
      stats: `${stats.quotes.active} active quotes`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Community Showcase',
      description: 'Feature community members and testimonials',
      icon: Users,
      href: '/admin/store-management/community',
      stats: `${stats.community.spotlights} spotlights`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];
}

/**
 * Calculate dashboard statistics from raw data
 */
export function calculateDashboardStats(data: {
  carouselItems: any[];
  banners: any[];
  quotes: any[];
  showcaseData: any;
  heroCustomization: any;
}): DashboardStats {
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
}

/**
 * Get status color based on value and threshold
 */
export function getStatusColor(value: number, threshold: number = 0): string {
  return value > threshold ? 'text-green-600' : 'text-gray-400';
}

/**
 * Get status text based on value and threshold
 */
export function getStatusText(value: number, threshold: number = 0, activeText: string, inactiveText: string): string {
  return value > threshold ? activeText : inactiveText;
}

/**
 * Format statistics for display
 */
export function formatStatistic(value: number, type: 'count' | 'percentage' | 'ratio' = 'count', max?: number): string {
  switch (type) {
    case 'count':
      return value.toString();
    case 'percentage':
      return `${value}%`;
    case 'ratio':
      return max ? `${value}/${max}` : value.toString();
    default:
      return value.toString();
  }
}

/**
 * Get completion status for a section
 */
export function getSectionCompletionStatus(stats: DashboardStats, section: string): {
  isComplete: boolean;
  completionText: string;
  completionColor: string;
} {
  switch (section) {
    case 'hero':
      return {
        isComplete: stats.hero.hasCustomQuote,
        completionText: stats.hero.hasCustomQuote ? 'Customized' : 'Default',
        completionColor: stats.hero.hasCustomQuote ? 'text-green-600' : 'text-gray-400'
      };
    case 'carousel':
      return {
        isComplete: stats.carousel.active > 0,
        completionText: stats.carousel.active > 0 ? 'Active' : 'Empty',
        completionColor: stats.carousel.active > 0 ? 'text-green-600' : 'text-gray-400'
      };
    case 'banners':
      return {
        isComplete: stats.banners.active > 0,
        completionText: stats.banners.active > 0 ? `${stats.banners.active} Active` : 'None',
        completionColor: stats.banners.active > 0 ? 'text-green-600' : 'text-gray-400'
      };
    case 'quotes':
      return {
        isComplete: stats.quotes.active > 0,
        completionText: stats.quotes.active > 0 ? `${stats.quotes.active} Active` : 'None',
        completionColor: stats.quotes.active > 0 ? 'text-green-600' : 'text-gray-400'
      };
    case 'community':
      return {
        isComplete: stats.community.spotlights > 0,
        completionText: stats.community.spotlights > 0 ? `${stats.community.spotlights} Features` : 'None',
        completionColor: stats.community.spotlights > 0 ? 'text-green-600' : 'text-gray-400'
      };
    default:
      return {
        isComplete: false,
        completionText: 'Unknown',
        completionColor: 'text-gray-400'
      };
  }
}

/**
 * Get priority level for a quick action
 */
export function getActionPriority(action: QuickAction, stats: DashboardStats): 'high' | 'medium' | 'low' {
  if (action.href.includes('carousel') && stats.carousel.active === 0) return 'high';
  if (action.href.includes('hero') && !stats.hero.hasCustomQuote) return 'high';
  if (action.href.includes('banners') && stats.banners.active === 0) return 'medium';
  if (action.href.includes('quotes') && stats.quotes.active === 0) return 'medium';
  if (action.href.includes('community') && stats.community.spotlights === 0) return 'low';
  return 'low';
}

/**
 * Generate dashboard summary text
 */
export function generateDashboardSummary(stats: DashboardStats): string {
  const sections = ['hero', 'carousel', 'banners', 'quotes', 'community'];
  const completedSections = sections.filter(section => {
    const status = getSectionCompletionStatus(stats, section);
    return status.isComplete;
  });

  const completionPercentage = Math.round((completedSections.length / sections.length) * 100);

  if (completionPercentage === 100) {
    return 'Your landing page is fully configured and ready to engage visitors!';
  } else if (completionPercentage >= 80) {
    return `Your landing page is ${completionPercentage}% complete. Just a few more touches needed!`;
  } else if (completionPercentage >= 60) {
    return `Your landing page is ${completionPercentage}% complete. You're making good progress!`;
  } else if (completionPercentage >= 40) {
    return `Your landing page is ${completionPercentage}% complete. Keep adding content to improve engagement.`;
  } else {
    return `Your landing page is ${completionPercentage}% complete. Start by adding content to key sections.`;
  }
}
