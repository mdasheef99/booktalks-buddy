/**
 * RSVP Analytics Overview Component
 *
 * Provides comprehensive RSVP analytics for club management dashboard.
 * Shows club-wide RSVP statistics and trends for club leads.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Calendar, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasEntitlement } from '@/lib/entitlements/hooks';
import { clubEventsService } from '@/lib/services/clubManagementService';

// =====================================================
// Types
// =====================================================

interface RSVPAnalyticsOverviewProps {
  clubId: string;
  className?: string;
}

interface ClubRSVPSummary {
  totalMeetings: number;
  totalRSVPs: number;
  averageResponseRate: number;
  upcomingMeetingsWithRSVPs: number;
  mostEngagedMeeting?: {
    title: string;
    responseRate: number;
    totalRSVPs: number;
  };
  recentTrend: 'up' | 'down' | 'stable';
}

// =====================================================
// RSVP Analytics Overview Component
// =====================================================

const RSVPAnalyticsOverview: React.FC<RSVPAnalyticsOverviewProps> = ({
  clubId,
  className = ''
}) => {
  // ✅ All hooks must be called at the top level, before any early returns
  const { result: canManageEvents } = useHasEntitlement('CAN_MANAGE_CLUB_EVENTS');

  const [summary, setSummary] = useState<ClubRSVPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRSVPSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch club-wide RSVP statistics
      const rsvpStats = await clubEventsService.getClubMeetingRSVPStats(clubId, false);

      if (!rsvpStats || rsvpStats.length === 0) {
        setSummary({
          totalMeetings: 0,
          totalRSVPs: 0,
          averageResponseRate: 0,
          upcomingMeetingsWithRSVPs: 0,
          recentTrend: 'stable'
        });
        return;
      }

      // Calculate summary statistics
      const totalMeetings = rsvpStats.length;
      const totalRSVPs = rsvpStats.reduce((sum: number, meeting: any) => sum + (meeting.total_rsvps || 0), 0);
      const averageResponseRate = rsvpStats.reduce((sum: number, meeting: any) => sum + (meeting.response_rate || 0), 0) / totalMeetings;

      // Count upcoming meetings with RSVPs
      const now = new Date();
      const upcomingMeetingsWithRSVPs = rsvpStats.filter((meeting: any) => {
        const meetingDate = new Date(meeting.scheduled_at);
        return meetingDate > now && (meeting.total_rsvps || 0) > 0;
      }).length;

      // Find most engaged meeting
      const mostEngagedMeeting = rsvpStats.reduce((best: any, current: any) => {
        if (!best || (current.response_rate || 0) > (best.response_rate || 0)) {
          return {
            title: current.meeting_title,
            responseRate: current.response_rate || 0,
            totalRSVPs: current.total_rsvps || 0
          };
        }
        return best;
      }, null);

      // Simple trend calculation (could be enhanced with historical data)
      const recentMeetings = rsvpStats.slice(0, 3);
      const olderMeetings = rsvpStats.slice(3, 6);

      let recentTrend: 'up' | 'down' | 'stable' = 'stable';
      if (recentMeetings.length > 0 && olderMeetings.length > 0) {
        const recentAvg = recentMeetings.reduce((sum: number, m: any) => sum + (m.response_rate || 0), 0) / recentMeetings.length;
        const olderAvg = olderMeetings.reduce((sum: number, m: any) => sum + (m.response_rate || 0), 0) / olderMeetings.length;

        if (recentAvg > olderAvg + 5) recentTrend = 'up';
        else if (recentAvg < olderAvg - 5) recentTrend = 'down';
      }

      setSummary({
        totalMeetings,
        totalRSVPs,
        averageResponseRate: Math.round(averageResponseRate * 100) / 100,
        upcomingMeetingsWithRSVPs,
        mostEngagedMeeting,
        recentTrend
      });

    } catch (err) {
      console.error('Error fetching RSVP summary:', err);
      setError('Failed to load RSVP analytics');
    } finally {
      setLoading(false);
    }
  }, [clubId]); // ✅ useCallback with clubId dependency

  // ✅ useEffect must be called consistently on every render
  useEffect(() => {
    if (clubId && canManageEvents) {
      fetchRSVPSummary();
    }
  }, [clubId, canManageEvents, fetchRSVPSummary]);

  const handleRefresh = () => {
    fetchRSVPSummary();
  };

  // ✅ Conditional return moved to after all hooks are called
  if (!canManageEvents) {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            RSVP Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            RSVP Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-red-600 mb-2">{error}</div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const getTrendIcon = () => {
    switch (summary.recentTrend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (summary.recentTrend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            RSVP Analytics Overview
          </div>
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.totalMeetings}</div>
            <div className="text-sm text-gray-500">Total Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-bookconnect-terracotta">{summary.totalRSVPs}</div>
            <div className="text-sm text-gray-500">Total RSVPs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.averageResponseRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Avg Response Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.upcomingMeetingsWithRSVPs}</div>
            <div className="text-sm text-gray-500">Upcoming w/ RSVPs</div>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            Response rate trend: {summary.recentTrend === 'up' ? 'Increasing' : summary.recentTrend === 'down' ? 'Decreasing' : 'Stable'}
          </span>
        </div>

        {/* Most Engaged Meeting */}
        {summary.mostEngagedMeeting && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Most Engaged Meeting</span>
            </div>
            <div className="text-sm text-blue-800">
              <div className="font-medium">{summary.mostEngagedMeeting.title}</div>
              <div className="flex items-center gap-4 mt-1">
                <span>{summary.mostEngagedMeeting.responseRate.toFixed(1)}% response rate</span>
                <span>{summary.mostEngagedMeeting.totalRSVPs} RSVPs</span>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {summary.totalMeetings === 0 && (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-600">No meetings with RSVP data yet</div>
            <div className="text-xs text-gray-500">Create meetings to start tracking RSVP analytics</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RSVPAnalyticsOverview;
