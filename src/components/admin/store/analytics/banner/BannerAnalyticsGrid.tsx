/**
 * Banner Analytics Grid Component
 * 
 * 6-metric overview grid for banner analytics dashboard
 * Follows BookTalks Buddy shared analytics component patterns
 */

import React from 'react';
import { MetricCard } from '@/components/admin/store/analytics/shared';
import { 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Target, 
  Users, 
  Activity,
  AlertCircle 
} from 'lucide-react';
import { formatCTR, formatNumber } from '@/lib/api/store/bannerAnalytics';
import type { MultiBannerAnalyticsSummary } from '@/lib/api/store/bannerAnalytics';

// =========================
// Component Props Interface
// =========================

interface BannerAnalyticsGridProps {
  summary: MultiBannerAnalyticsSummary | undefined;
  isLoading: boolean;
  className?: string;
}

// =========================
// Utility Functions
// =========================

/**
 * Get performance color based on CTR value
 */
const getPerformanceColor = (ctr: number): { iconBgColor: string; iconColor: string } => {
  if (ctr >= 10) return { iconBgColor: 'bg-green-100', iconColor: 'text-green-600' };
  if (ctr >= 5) return { iconBgColor: 'bg-blue-100', iconColor: 'text-blue-600' };
  if (ctr >= 2) return { iconBgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' };
  return { iconBgColor: 'bg-red-100', iconColor: 'text-red-600' };
};

/**
 * Get engagement level description
 */
const getEngagementLevel = (ctr: number): string => {
  if (ctr >= 10) return 'Excellent performance';
  if (ctr >= 5) return 'Good performance';
  if (ctr >= 2) return 'Average performance';
  return 'Needs improvement';
};

/**
 * Format percentage with proper suffix
 */
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// =========================
// Loading State Component
// =========================

const LoadingGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// =========================
// Main Component
// =========================

/**
 * Banner Analytics Grid - 6-metric overview
 * Displays key banner performance metrics in a responsive grid layout
 */
export const BannerAnalyticsGrid: React.FC<BannerAnalyticsGridProps> = ({
  summary,
  isLoading,
  className = ''
}) => {
  // Show loading state
  if (isLoading || !summary) {
    return <LoadingGrid />;
  }

  // Calculate derived metrics
  const performanceColors = getPerformanceColor(summary.overallCTR);
  const engagementLevel = getEngagementLevel(summary.overallCTR);
  const avgImpressionsPerBanner = summary.activeBannersCount > 0 
    ? Math.round(summary.totalImpressions / summary.activeBannersCount)
    : 0;
  const avgClicksPerBanner = summary.activeBannersCount > 0 
    ? Math.round(summary.totalClicks / summary.activeBannersCount)
    : 0;

  // Metric cards configuration
  const metrics = [
    {
      title: 'Total Impressions',
      value: formatNumber(summary.totalImpressions),
      subtitle: `Across ${summary.activeBannersCount} banners`,
      icon: <Eye className="h-6 w-6" />,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Clicks',
      value: formatNumber(summary.totalClicks),
      subtitle: `${avgClicksPerBanner} avg per banner`,
      icon: <MousePointer className="h-6 w-6" />,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Click-Through Rate',
      value: formatCTR(summary.overallCTR),
      subtitle: engagementLevel,
      icon: <TrendingUp className="h-6 w-6" />,
      iconBgColor: performanceColors.iconBgColor,
      iconColor: performanceColors.iconColor
    },
    {
      title: 'Active Banners',
      value: summary.activeBannersCount.toString(),
      subtitle: `${avgImpressionsPerBanner} avg impressions`,
      icon: <Target className="h-6 w-6" />,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Unique Visitors',
      value: formatNumber(summary.uniqueVisitors),
      subtitle: `${summary.totalSessions} total sessions`,
      icon: <Users className="h-6 w-6" />,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Average CTR',
      value: formatCTR(summary.avgCTRAllBanners),
      subtitle: 'All banners combined',
      icon: <Activity className="h-6 w-6" />,
      iconBgColor: 'bg-teal-100',
      iconColor: 'text-teal-600'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Alert (if CTR is low) */}
      {summary.overallCTR < 2 && summary.totalImpressions > 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Low Click-Through Rate Detected
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your overall CTR of {formatCTR(summary.overallCTR)} is below the recommended 2%. 
                Consider reviewing banner content, positioning, or targeting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            iconBgColor={metric.iconBgColor}
            iconColor={metric.iconColor}
          />
        ))}
      </div>

      {/* Quick Insights */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Top Performer:</span>{' '}
            {summary.topPerformingBannerId !== 'None' 
              ? `Banner ${summary.topPerformingBannerId.slice(0, 8)}...`
              : 'No data available'
            }
          </div>
          <div>
            <span className="font-medium">Needs Attention:</span>{' '}
            {summary.worstPerformingBannerId !== 'None' 
              ? `Banner ${summary.worstPerformingBannerId.slice(0, 8)}...`
              : 'All banners performing well'
            }
          </div>
          <div>
            <span className="font-medium">Period:</span> {summary.period}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================
// Component Variants
// =========================

/**
 * Compact version for smaller spaces
 */
export const BannerAnalyticsGridCompact: React.FC<BannerAnalyticsGridProps> = ({
  summary,
  isLoading,
  className = ''
}) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white rounded-lg border p-4">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const performanceColors = getPerformanceColor(summary.overallCTR);

  const compactMetrics = [
    {
      title: 'Impressions',
      value: formatNumber(summary.totalImpressions),
      icon: <Eye className="h-5 w-5" />,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Clicks',
      value: formatNumber(summary.totalClicks),
      icon: <MousePointer className="h-5 w-5" />,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'CTR',
      value: formatCTR(summary.overallCTR),
      icon: <TrendingUp className="h-5 w-5" />,
      iconBgColor: performanceColors.iconBgColor,
      iconColor: performanceColors.iconColor
    },
    {
      title: 'Banners',
      value: summary.activeBannersCount.toString(),
      icon: <Target className="h-5 w-5" />,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {compactMetrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          iconBgColor={metric.iconBgColor}
          iconColor={metric.iconColor}
        />
      ))}
    </div>
  );
};

export default BannerAnalyticsGrid;
