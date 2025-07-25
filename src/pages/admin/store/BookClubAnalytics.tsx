import React from 'react';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { useBookClubAnalytics } from '@/hooks/analytics/useBookClubAnalytics';
import {
  AnalyticsPageLayout,
  AnalyticsPageHeader,
  TimeRangeSelector,
  AnalyticsDataNotice
} from '@/components/admin/store/analytics/shared';
import {
  BookClubMetricsGrid,
  CurrentBooksSection,
  TrendingBooksSection,
  ClubActivitySection,
  InsightsSection
} from '@/components/admin/store/analytics/bookclub';
import { RefreshCw, Eye } from 'lucide-react';

/**
 * Book Club Analytics Dashboard for Store Owners
 * Provides insights about book club activities and discussion trends
 */
export const BookClubAnalytics: React.FC = () => {
  const { storeId } = useStoreOwnerContext();

  const {
    timeRange,
    setTimeRange,
    analyticsData,
    insights,
    isLoading,
    analyticsError,
    refetchAll
  } = useBookClubAnalytics({ storeId });

  // Extract data for components
  const summary = analyticsData?.summary;
  const currentBooks = analyticsData?.currentBooks || [];
  const trendingBooks = analyticsData?.trendingBooks || [];
  const clubActivity = analyticsData?.clubActivity || [];

  // Header actions
  const headerActions = [
    {
      label: 'Manage Clubs',
      icon: <Eye className="h-4 w-4" />,
      href: '/admin/clubs'
    },
    {
      label: 'Refresh Data',
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: refetchAll
    }
  ];

  return (
    <AnalyticsPageLayout
      isLoading={isLoading}
      error={analyticsError}
      loadingText="Loading book club analytics..."
      errorMessage="Failed to load book club analytics data. Please try refreshing the page."
    >
      {/* Page Header */}
      <AnalyticsPageHeader
        title="Book Club Analytics"
        description="Insights about book club activities and discussion trends in your store"
        actions={headerActions}
      >
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
        />
      </AnalyticsPageHeader>

      {/* Summary Metrics */}
      <BookClubMetricsGrid summary={summary} />

      {/* Current Books Being Discussed */}
      <CurrentBooksSection currentBooks={currentBooks} />

      {/* Trending Books and Club Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TrendingBooksSection trendingBooks={trendingBooks} />
        <ClubActivitySection clubActivity={clubActivity} />
      </div>

      {/* Insights and Recommendations */}
      <InsightsSection insights={insights} />

      {/* Data Notice */}
      <AnalyticsDataNotice
        title="Book Club Analytics"
        description="Analytics data is collected from public book clubs only to protect member privacy. Private club activities are not included in these insights. Data updates in real-time as club members participate in discussions."
        variant="blue"
      />
    </AnalyticsPageLayout>
  );
};
