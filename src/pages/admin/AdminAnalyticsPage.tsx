import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import custom hooks
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

// Import components
import TimeRangeSelector from '@/components/admin/analytics/TimeRangeSelector';
import UserStatsSummary from '@/components/admin/analytics/UserStatsSummary';
import UserTiersSummary from '@/components/admin/analytics/UserTiersSummary';
import ActivitySummary from '@/components/admin/analytics/ActivitySummary';
import UserGrowthChart from '@/components/admin/analytics/UserGrowthChart';
import ActivityChart from '@/components/admin/analytics/ActivityChart';
import AnalyticsLoadingSkeleton from '@/components/admin/analytics/AnalyticsLoadingSkeleton';

/**
 * Admin Analytics Page Component
 * Displays analytics data for the platform including user growth and activity
 */
const AdminAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  // Use our custom hook for analytics data
  const {
    timeRange,
    updateTimeRange,
    refreshData,
    loading,
    error,
    userGrowthData,
    activityData,
    userStats
  } = useAnalyticsData('12months');

  // Navigate back to dashboard
  const handleBackToDashboard = useCallback(() => {
    navigate('/admin/dashboard');
  }, [navigate]);

  // Show loading skeleton while data is being fetched
  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  // Show error message if there was an error fetching data
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <h2 className="text-lg font-semibold mb-2">Error Loading Analytics</h2>
        <p>{error.message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={refreshData}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={handleBackToDashboard}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <UserStatsSummary stats={userStats} />
        <UserTiersSummary stats={userStats} />
        <ActivitySummary data={activityData} />
      </div>

      {/* Time Range Selector */}
      <TimeRangeSelector
        timeRange={timeRange}
        onTimeRangeChange={updateTimeRange}
      />

      {/* Charts */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            User Growth
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Platform Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Growth Over Time
              </CardTitle>
              <CardDescription>
                Shows cumulative user growth and new user registrations by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserGrowthChart data={userGrowthData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Activity
              </CardTitle>
              <CardDescription>
                Shows new discussions and book clubs created by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityChart data={activityData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsPage;
