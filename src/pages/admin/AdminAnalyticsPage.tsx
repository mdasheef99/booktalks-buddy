import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, TrendingUp, BookOpen, MessageSquare, Calendar, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Simple interface for user growth data
interface UserGrowthData {
  date: string;
  count: number;
  newUsers: number;
}

// Interface for activity data
interface ActivityData {
  month: string;
  discussions: number;
  clubs: number;
}

const AdminAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    usersByTier: {
      free: 0,
      privileged: 0,
      privileged_plus: 0
    }
  });
  const [timeRange, setTimeRange] = useState<'6months' | '12months' | 'all'>('12months');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        // Get user creation dates
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('created_at, account_tier')
          .order('created_at');

        if (userError) throw userError;

        if (!userData || userData.length === 0) {
          setUserGrowthData([]);
          return;
        }

        // Get discussion creation dates
        const { data: discussionData, error: discussionError } = await supabase
          .from('discussion_topics')
          .select('created_at')
          .order('created_at');

        if (discussionError) throw discussionError;

        // Get club creation dates
        const { data: clubData, error: clubError } = await supabase
          .from('book_clubs')
          .select('created_at')
          .order('created_at');

        if (clubError) throw clubError;

        // Process user data to create a cumulative growth chart
        const growthData: UserGrowthData[] = [];
        const dateMap = new Map<string, { total: number, new: number }>();

        // Calculate time range limit
        let timeLimit = new Date();
        if (timeRange === '6months') {
          timeLimit.setMonth(timeLimit.getMonth() - 6);
        } else if (timeRange === '12months') {
          timeLimit.setMonth(timeLimit.getMonth() - 12);
        } else {
          // For 'all', set to a very old date
          timeLimit = new Date(2000, 0, 1);
        }

        // Group by month
        userData.forEach(user => {
          if (!user.created_at) return;

          const date = new Date(user.created_at);
          // Skip if outside the selected time range
          if (date < timeLimit) return;

          // Format date as YYYY-MM
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          const currentData = dateMap.get(monthKey) || { total: 0, new: 0 };
          currentData.new += 1;
          dateMap.set(monthKey, currentData);
        });

        // Sort dates and create cumulative data
        const sortedDates = Array.from(dateMap.keys()).sort();
        let cumulativeCount = 0;

        // Count users before the time range
        if (timeRange !== 'all') {
          userData.forEach(user => {
            if (!user.created_at) return;
            const date = new Date(user.created_at);
            if (date < timeLimit) {
              cumulativeCount++;
            }
          });
        }

        sortedDates.forEach(date => {
          const monthData = dateMap.get(date) || { total: 0, new: 0 };
          cumulativeCount += monthData.new;
          growthData.push({
            date,
            count: cumulativeCount,
            newUsers: monthData.new
          });
        });

        setUserGrowthData(growthData);

        // Process activity data
        const activityByMonth = new Map<string, { discussions: number, clubs: number }>();

        // Process discussions
        discussionData?.forEach(discussion => {
          if (!discussion.created_at) return;

          const date = new Date(discussion.created_at);
          // Skip if outside the selected time range
          if (date < timeLimit) return;

          // Format date as YYYY-MM
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          const currentData = activityByMonth.get(monthKey) || { discussions: 0, clubs: 0 };
          currentData.discussions += 1;
          activityByMonth.set(monthKey, currentData);
        });

        // Process clubs
        clubData?.forEach(club => {
          if (!club.created_at) return;

          const date = new Date(club.created_at);
          // Skip if outside the selected time range
          if (date < timeLimit) return;

          // Format date as YYYY-MM
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          const currentData = activityByMonth.get(monthKey) || { discussions: 0, clubs: 0 };
          currentData.clubs += 1;
          activityByMonth.set(monthKey, currentData);
        });

        // Convert to array
        const activityArray: ActivityData[] = [];
        const sortedActivityDates = Array.from(activityByMonth.keys()).sort();

        sortedActivityDates.forEach(month => {
          const data = activityByMonth.get(month) || { discussions: 0, clubs: 0 };
          activityArray.push({
            month,
            discussions: data.discussions,
            clubs: data.clubs
          });
        });

        setActivityData(activityArray);

        // Calculate user stats
        const tierCounts = {
          free: 0,
          privileged: 0,
          privileged_plus: 0
        };

        userData.forEach(user => {
          if (user.account_tier && user.account_tier in tierCounts) {
            tierCounts[user.account_tier as keyof typeof tierCounts]++;
          }
        });

        setUserStats({
          totalUsers: userData.length,
          activeUsers: Math.floor(userData.length * 0.7), // Placeholder - would need actual login data
          usersByTier: tierCounts
        });

      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  // Format month for display
  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // User growth chart renderer
  const renderUserGrowthChart = () => {
    if (userGrowthData.length === 0) {
      return <p className="text-center text-muted-foreground">No user data available</p>;
    }

    const maxCount = Math.max(...userGrowthData.map(d => d.count));
    const maxNewUsers = Math.max(...userGrowthData.map(d => d.newUsers));

    return (
      <div className="mt-6">
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-bookconnect-terracotta rounded-full mr-1"></div>
              <span>Total Users</span>
            </div>
            <div className="flex items-center ml-4">
              <div className="w-3 h-3 bg-bookconnect-sage rounded-full mr-1"></div>
              <span>New Users</span>
            </div>
          </div>
        </div>

        <div className="h-64 flex items-end space-x-1 relative border-b border-l border-gray-200 pt-5">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-6">
            <span>0</span>
            <span>{Math.floor(maxCount / 2)}</span>
            <span>{maxCount}</span>
          </div>

          {userGrowthData.map((data, index) => (
            <div key={index} className="flex flex-col items-center group relative" style={{ flex: '1' }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 bg-white shadow-lg rounded p-2 text-xs hidden group-hover:block z-10 w-36">
                <p className="font-semibold">{formatMonth(data.date)}</p>
                <p>Total Users: {data.count}</p>
                <p>New Users: {data.newUsers}</p>
              </div>

              {/* New users bar */}
              <div
                className="bg-bookconnect-sage w-full rounded-t-sm transition-all duration-500 opacity-80"
                style={{
                  height: `${(data.newUsers / maxCount) * 100}%`,
                  minHeight: data.newUsers > 0 ? '4px' : '0'
                }}
              ></div>

              {/* Total users bar */}
              <div
                className="bg-bookconnect-terracotta w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${(data.count / maxCount) * 100}%`,
                  minHeight: '4px',
                  opacity: 0.2
                }}
              ></div>

              {/* X-axis label - only show every other month for readability */}
              {index % 2 === 0 && (
                <div className="text-xs mt-2 -rotate-45 origin-top-left text-gray-500">
                  {formatMonth(data.date)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Activity chart renderer
  const renderActivityChart = () => {
    if (activityData.length === 0) {
      return <p className="text-center text-muted-foreground">No activity data available</p>;
    }

    const maxDiscussions = Math.max(...activityData.map(d => d.discussions));
    const maxClubs = Math.max(...activityData.map(d => d.clubs));
    const maxValue = Math.max(maxDiscussions, maxClubs);

    return (
      <div className="mt-6">
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-bookconnect-brown rounded-full mr-1"></div>
              <span>New Discussions</span>
            </div>
            <div className="flex items-center ml-4">
              <div className="w-3 h-3 bg-bookconnect-terracotta rounded-full mr-1"></div>
              <span>New Clubs</span>
            </div>
          </div>
        </div>

        <div className="h-64 flex items-end space-x-1 relative border-b border-l border-gray-200 pt-5">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-6">
            <span>0</span>
            <span>{Math.floor(maxValue / 2)}</span>
            <span>{maxValue}</span>
          </div>

          {activityData.map((data, index) => (
            <div key={index} className="flex flex-col items-center group relative" style={{ flex: '1' }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 bg-white shadow-lg rounded p-2 text-xs hidden group-hover:block z-10 w-36">
                <p className="font-semibold">{formatMonth(data.month)}</p>
                <p>New Discussions: {data.discussions}</p>
                <p>New Clubs: {data.clubs}</p>
              </div>

              <div className="flex w-full h-full items-end">
                {/* Discussions bar */}
                <div
                  className="bg-bookconnect-brown w-1/2 rounded-t-sm transition-all duration-500 mr-px"
                  style={{
                    height: `${(data.discussions / maxValue) * 100}%`,
                    minHeight: data.discussions > 0 ? '4px' : '0'
                  }}
                ></div>

                {/* Clubs bar */}
                <div
                  className="bg-bookconnect-terracotta w-1/2 rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${(data.clubs / maxValue) * 100}%`,
                    minHeight: data.clubs > 0 ? '4px' : '0'
                  }}
                ></div>
              </div>

              {/* X-axis label - only show every other month for readability */}
              {index % 2 === 0 && (
                <div className="text-xs mt-2 -rotate-45 origin-top-left text-gray-500">
                  {formatMonth(data.month)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
        <div className="h-64 bg-gray-300 rounded"></div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/dashboard')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{userStats.totalUsers}</div>
              <Users className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Estimated active: {userStats.activeUsers} ({Math.round((userStats.activeUsers / userStats.totalUsers) * 100)}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">User Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Free:</span>
                <span>{userStats.usersByTier.free} ({Math.round((userStats.usersByTier.free / userStats.totalUsers) * 100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Privileged:</span>
                <span>{userStats.usersByTier.privileged} ({Math.round((userStats.usersByTier.privileged / userStats.totalUsers) * 100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Privileged+:</span>
                <span>{userStats.usersByTier.privileged_plus} ({Math.round((userStats.usersByTier.privileged_plus / userStats.totalUsers) * 100)}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Discussions:</span>
                <span>{activityData.reduce((sum, item) => sum + item.discussions, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Clubs:</span>
                <span>{activityData.reduce((sum, item) => sum + item.clubs, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discussions per Club:</span>
                <span>
                  {(activityData.reduce((sum, item) => sum + item.discussions, 0) /
                    Math.max(1, activityData.reduce((sum, item) => sum + item.clubs, 0))).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex items-center rounded-md border border-input bg-background p-1">
          <Button
            variant={timeRange === '6months' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('6months')}
            className="text-xs"
          >
            6 Months
          </Button>
          <Button
            variant={timeRange === '12months' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('12months')}
            className="text-xs"
          >
            12 Months
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('all')}
            className="text-xs"
          >
            All Time
          </Button>
        </div>
      </div>

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
              {renderUserGrowthChart()}
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
              {renderActivityChart()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsPage;
