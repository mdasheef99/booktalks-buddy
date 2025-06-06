/**
 * Event Analytics Card Component
 *
 * Displays meeting analytics and metrics for the club.
 */

import React from 'react';
import { Calendar, Clock, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MeetingAnalytics } from '@/lib/services/clubManagementService';

// =====================================================
// Types
// =====================================================

interface EventAnalyticsCardProps {
  analytics: MeetingAnalytics | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

// =====================================================
// Event Analytics Card Component
// =====================================================

const EventAnalyticsCard: React.FC<EventAnalyticsCardProps> = ({
  analytics,
  loading,
  error,
  onRefresh
}) => {
  // Loading skeleton
  if (loading && !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meeting Analytics
          </CardTitle>
          <CardDescription>
            Overview of your club's meeting activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meeting Analytics
          </CardTitle>
          <CardDescription>
            Overview of your club's meeting activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Analytics</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meeting Analytics
          </CardTitle>
          <CardDescription>
            Overview of your club's meeting activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Meeting Data</h3>
            <p className="text-gray-600">Analytics will appear once you create meetings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Helper function to get meeting type display
  const getMeetingTypeDisplay = (type: string): string => {
    const types = {
      discussion: 'Discussion',
      social: 'Social',
      planning: 'Planning',
      author_event: 'Author Event',
      other: 'Other'
    };
    return types[type as keyof typeof types] || 'Other';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meeting Analytics
          </CardTitle>
          <CardDescription>
            Overview of your club's meeting activity
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Meetings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Total Meetings</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.total_meetings}
            </div>
            <p className="text-xs text-gray-500">All time</p>
          </div>

          {/* Upcoming Meetings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Upcoming</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.upcoming_meetings}
            </div>
            <p className="text-xs text-gray-500">Scheduled</p>
          </div>

          {/* This Month */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">This Month</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {analytics.meetings_this_month}
            </div>
            <p className="text-xs text-gray-500">Meetings</p>
          </div>

          {/* Average Duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Avg Duration</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatDuration(analytics.avg_duration_minutes)}
            </div>
            <p className="text-xs text-gray-500">Per meeting</p>
          </div>
        </div>

        {/* Most Common Type */}
        {analytics.most_common_type && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Most Common Meeting Type</h4>
                <Badge className="bg-bookconnect-terracotta/10 text-bookconnect-terracotta">
                  {getMeetingTypeDisplay(analytics.most_common_type)}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Based on historical data</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Insights */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Quick Insights</h4>
          <div className="space-y-2">
            {analytics.upcoming_meetings > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>
                  You have {analytics.upcoming_meetings} upcoming meeting{analytics.upcoming_meetings !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {analytics.meetings_this_month > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  {analytics.meetings_this_month} meeting{analytics.meetings_this_month !== 1 ? 's' : ''} scheduled this month
                </span>
              </div>
            )}

            {analytics.total_meetings === 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Create your first meeting to start building engagement</span>
              </div>
            )}

            {analytics.avg_duration_minutes > 0 && analytics.total_meetings > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>
                  Average meeting duration is {formatDuration(analytics.avg_duration_minutes)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventAnalyticsCard;
