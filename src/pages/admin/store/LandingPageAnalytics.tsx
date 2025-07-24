import React from 'react';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { useLandingPageAnalytics } from '@/hooks/analytics/useLandingPageAnalytics';
import {
  AnalyticsPageLayout,
  AnalyticsPageHeader,
  AnalyticsDataNotice
} from '@/components/admin/store/analytics/shared';
import {
  LandingPageMetricsGrid,
  PerformanceAlertsSection,
  RecommendationsSection,
  SectionAnalyticsGrid
} from '@/components/admin/store/analytics/landing';
import { BarChart3, Eye } from 'lucide-react';

/**
 * Landing Page Analytics Dashboard - Basic Performance Alerts Only
 * Reduced scope implementation focusing on essential insights
 */
export const LandingPageAnalytics: React.FC = () => {
  const { storeId } = useStoreOwnerContext();

  const {
    enhancedAnalytics,
    performanceAlerts,
    recommendations,
    isLoading,
    analyticsError,
    refetchAll
  } = useLandingPageAnalytics({ storeId });

  const analyticsSummary = enhancedAnalytics?.summary;

  // Header actions
  const headerActions = [
    {
      label: 'View Landing Page',
      icon: <Eye className="h-4 w-4" />,
      href: '/'
    },
    {
      label: 'Refresh Data',
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: refetchAll
    }
  ];

  return (
    <AnalyticsPageLayout
      isLoading={isLoading}
      error={analyticsError}
      loadingText="Loading landing page analytics..."
      errorMessage="Failed to load analytics data. Please try refreshing the page."
    >
      {/* Page Header */}
      <AnalyticsPageHeader
        title="Landing Page Analytics"
        description="Basic performance insights and recommendations for your landing page"
        actions={headerActions}
      />

      {/* Enhanced Metrics Overview */}
      <LandingPageMetricsGrid analyticsSummary={analyticsSummary} />



      {/* Performance Alerts */}
      <PerformanceAlertsSection performanceAlerts={performanceAlerts} />

      {/* Basic Recommendations */}
      <RecommendationsSection recommendations={recommendations} />

      {/* Section-Specific Analytics */}
      <SectionAnalyticsGrid enhancedAnalytics={enhancedAnalytics} />

      {/* Data Notice */}
      <AnalyticsDataNotice
        title="Analytics Data Collection"
        description="Analytics data is collected automatically as visitors interact with your landing page. Data may take 24-48 hours to appear for new stores. This dashboard shows basic performance insights and recommendations only."
        variant="blue"
      />
    </AnalyticsPageLayout>
  );
};
