import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { BookClubAnalyticsAPI } from '@/lib/api/store/bookClubAnalytics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  RefreshCw,
  Info,
  Calendar,
  BarChart3,
  Eye,
  Clock,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Book Club Analytics Dashboard for Store Owners
 * Provides insights about book club activities and discussion trends
 */
export const BookClubAnalytics: React.FC = () => {
  const { storeId } = useStoreOwnerContext();
  const [timeRange, setTimeRange] = useState<number>(30);

  // Fetch comprehensive analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['book-club-analytics', storeId, timeRange],
    queryFn: () => BookClubAnalyticsAPI.getComprehensiveAnalytics(storeId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch insights and recommendations
  const {
    data: insights,
    isLoading: insightsLoading
  } = useQuery({
    queryKey: ['book-club-insights', storeId],
    queryFn: () => BookClubAnalyticsAPI.getAnalyticsInsights(storeId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const isLoading = analyticsLoading || insightsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading book club analytics..." />
      </div>
    );
  }

  // Error state
  if (analyticsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load book club analytics data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const summary = analyticsData?.summary;
  const currentBooks = analyticsData?.currentBooks || [];
  const trendingBooks = analyticsData?.trendingBooks || [];
  const clubActivity = analyticsData?.clubActivity || [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Club Analytics</h1>
          <p className="text-gray-600 mt-2">
            Insights about book club activities and discussion trends in your store
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link to="/admin/clubs">
              <Eye className="h-4 w-4" />
              Manage Clubs
            </Link>
          </Button>

          <Button
            onClick={() => refetchAnalytics()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clubs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.activeClubsCount || 0}
                </p>
                <p className="text-xs text-gray-500">{summary?.period}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Books</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.currentBooksCount || 0}
                </p>
                <p className="text-xs text-gray-500">Being discussed</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Discussions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.totalDiscussionsCount || 0}
                </p>
                <p className="text-xs text-gray-500">Total topics</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Posts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.totalPostsCount || 0}
                </p>
                <p className="text-xs text-gray-500">Total messages</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.avgPostsPerDiscussion?.toFixed(1) || '0.0'}
                </p>
                <p className="text-xs text-gray-500">Posts per topic</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.totalMembersCount || 0}
                </p>
                <p className="text-xs text-gray-500">Active participants</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Books Being Discussed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Current Book Discussions
          </CardTitle>
          <CardDescription>
            Books currently being discussed across your book clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentBooks.map((book, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 line-clamp-2">{book.bookTitle}</h4>
                      <p className="text-sm text-gray-600">by {book.bookAuthor}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {book.clubCount} club{book.clubCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{book.totalDiscussions} discussions</span>
                    </div>
                    {book.latestActivity && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last activity: {new Date(book.latestActivity).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No books are currently being discussed</p>
              <p className="text-sm">Encourage your book clubs to select their current reads</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Books and Club Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trending Books */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Books
            </CardTitle>
            <CardDescription>
              Books generating the most discussion activity recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendingBooks.length > 0 ? (
              <div className="space-y-4">
                {trendingBooks.slice(0, 5).map((book, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{book.bookTitle}</h4>
                      <p className="text-sm text-gray-600">by {book.bookAuthor}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{book.discussionCount} discussions</span>
                        <span>{book.postCount} posts</span>
                        <span>{book.clubCount} clubs</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-bookconnect-brown">
                        {book.trendScore.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">trend score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No trending books found</p>
                <p className="text-sm">Books will appear here as discussions increase</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Club Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Club Activity
            </CardTitle>
            <CardDescription>
              Most active book clubs in your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clubActivity.length > 0 ? (
              <div className="space-y-4">
                {clubActivity.slice(0, 5).map((club, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{club.clubName}</h4>
                      {club.currentBookTitle && (
                        <p className="text-sm text-gray-600">
                          Reading: {club.currentBookTitle}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{club.memberCount} members</span>
                        <span>{club.discussionCount} discussions</span>
                        <span>{club.postCount} posts</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-bookconnect-sage">
                        {club.activityScore.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">activity score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No club activity found</p>
                <p className="text-sm">Activity will appear as clubs become more engaged</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Key Insights
              </CardTitle>
              <CardDescription>
                Automated insights about your book club community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.insights.length > 0 ? (
                <div className="space-y-3">
                  {insights.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No insights available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Suggestions to improve your book club engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Target className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recommendations at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Book Club Analytics</h4>
              <p className="text-sm text-blue-800">
                Analytics data is collected from public book clubs only to protect member privacy.
                Private club activities are not included in these insights. Data updates in real-time
                as club members participate in discussions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
