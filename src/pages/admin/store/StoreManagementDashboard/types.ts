/**
 * Store Management Dashboard Types
 * 
 * Type definitions for dashboard components and data structures
 */

import type { LucideIcon } from 'lucide-react';

// Dashboard statistics interface
export interface DashboardStats {
  carousel: {
    total: number;
    active: number;
    max: number;
  };
  banners: {
    total: number;
    active: number;
  };
  quotes: {
    total: number;
    active: number;
  };
  community: {
    spotlights: number;
    testimonials: number;
    activities: number;
  };
  hero: {
    hasCustomQuote: boolean;
    chatButtonEnabled: boolean;
  };
}

// Quick action item interface
export interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  disabled: boolean;
  color: string;
}

// Management section interface
export interface ManagementSection {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  stats: string;
  color: string;
  bgColor: string;
}

// Analytics metrics interface
export interface AnalyticsMetrics {
  pageViews: number;
  chatClicks: number;
  bounceRate: number;
  hasData: boolean;
}

// Dashboard data interface
export interface DashboardData {
  carouselItems: any[];
  banners: any[];
  quotes: any[];
  showcaseData: any;
  heroCustomization: any;
  analyticsMetrics: AnalyticsMetrics;
}

// Loading states interface
export interface LoadingStates {
  carouselLoading: boolean;
  bannersLoading: boolean;
  quotesLoading: boolean;
  showcaseLoading: boolean;
  heroLoading: boolean;
  analyticsLoading: boolean;
}

// Dashboard props interface
export interface DashboardProps {
  className?: string;
}

// Overview statistics props
export interface OverviewStatisticsProps {
  stats: DashboardStats;
  analyticsMetrics: AnalyticsMetrics;
}

// Quick actions props
export interface QuickActionsProps {
  actions: QuickAction[];
}

// Management sections props
export interface ManagementSectionsProps {
  sections: ManagementSection[];
}

// Landing page status props
export interface LandingPageStatusProps {
  stats: DashboardStats;
}

// Quick tips props
export interface QuickTipsProps {
  stats: DashboardStats;
}

// Dashboard header props
export interface DashboardHeaderProps {
  title?: string;
  description?: string;
  showViewLandingPage?: boolean;
  showViewAnalytics?: boolean;
}

// Statistics card props
export interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  subtitle?: string;
}

// Quick action card props
export interface QuickActionCardProps {
  action: QuickAction;
}

// Management section card props
export interface ManagementSectionCardProps {
  section: ManagementSection;
}

// Status item props
export interface StatusItemProps {
  label: string;
  value: string;
  isActive: boolean;
}

// Tip item props
export interface TipItemProps {
  message: string;
  bgColor: string;
  textColor: string;
  show: boolean;
}
