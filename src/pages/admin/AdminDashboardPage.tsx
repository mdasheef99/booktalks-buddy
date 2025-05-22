import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart, Bell, RefreshCw, Shield } from 'lucide-react';
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-bookconnect-brown">Dashboard</h1>
          {stats.lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Time Range Filter */}
          <TimeRangeFilter
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />

          <div className="flex gap-2 ml-auto">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
              title="Refresh dashboard data"
            >
              <RefreshCw className="h-4 w-4 text-bookconnect-sage" />
              Refresh
            </Button>

            <Button
              onClick={() => navigate('/admin/analytics')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart className="h-4 w-4 text-bookconnect-brown" />
              View Analytics
            </Button>

            <Button
              onClick={() => navigate('/admin/moderation')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-bookconnect-brown" />
              Moderation
            </Button>

            {stats.pendingJoinRequests > 0 && (
              <Button
                onClick={() => navigate('/admin/requests')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4 text-bookconnect-terracotta" />
                Pending Requests
                <Badge className="ml-1 bg-bookconnect-terracotta">{stats.pendingJoinRequests}</Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <MainStatsRow stats={stats} timeRange={timeRange} />

      {/* Quick Stats Row */}
      <QuickStatsRow stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TierDistributionCard
          tierDistribution={stats.tierDistribution}
          totalUsers={stats.totalUsers}
        />

        <RecentActivityCard
          recentActivity={stats.recentActivity}
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
