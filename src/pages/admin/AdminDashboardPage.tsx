import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart, RefreshCw, Shield } from 'lucide-react';
import {
  useAdminStats,
  useTimeRangeFilter,
  TimeRangeFilter,
  LoadingDashboard,
  MainStatsRow,
  QuickStatsRow,
  TierDistributionCard,
  RecentActivityCard,
  TimeRange
} from './dashboard';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { timeRange, setTimeRange } = useTimeRangeFilter('month');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { loading, stats, error } = useAdminStats(timeRange, refreshKey);

  // Handle time range changes
  const handleTimeRangeChange = useCallback((newRange: TimeRange) => {
    setTimeRange(newRange);
  }, [setTimeRange]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (loading) {
    return <LoadingDashboard />;
  }

  // Display error message if there's an error
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-serif text-bookconnect-brown mb-4">Dashboard Error</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error.message}
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="bg-bookconnect-brown hover:bg-bookconnect-brown/90"
        >
          Refresh Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/book-club')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Book Clubs
      </Button>

      {/* Dashboard Header - Improved Layout */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-serif text-bookconnect-brown mb-2">Admin Dashboard</h1>
            {stats.lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Time Range Filter */}
            <div className="flex-shrink-0">
              <TimeRangeFilter
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-bookconnect-sage/10"
                title="Refresh dashboard data"
              >
                <RefreshCw className="h-4 w-4 text-bookconnect-sage" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                onClick={() => navigate('/admin/analytics')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-bookconnect-brown/10"
              >
                <BarChart className="h-4 w-4 text-bookconnect-brown" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>

              <Button
                onClick={() => navigate('/admin/moderation')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-bookconnect-brown/10"
              >
                <Shield className="h-4 w-4 text-bookconnect-brown" />
                <span className="hidden sm:inline">Moderation</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Section */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-bookconnect-brown mb-1">Key Metrics</h2>
          <p className="text-sm text-muted-foreground">Overview of your platform's performance</p>
        </div>
        <MainStatsRow stats={stats} timeRange={timeRange} />
      </div>

      {/* Secondary Metrics Section */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-bookconnect-brown mb-1">Activity Overview</h2>
          <p className="text-sm text-muted-foreground">Recent activity and engagement metrics</p>
        </div>
        <QuickStatsRow stats={stats} />
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-bookconnect-brown mb-1">Detailed Analytics</h2>
          <p className="text-sm text-muted-foreground">User distribution and activity trends</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TierDistributionCard
            tierDistribution={stats.tierDistribution}
            totalUsers={stats.totalUsers}
          />

          <RecentActivityCard
            recentActivity={stats.recentActivity}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
