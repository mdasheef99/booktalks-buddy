/**
 * Performance Indicators Component
 *
 * Displays key performance indicators for the club.
 */

import React from 'react';
import { CheckCircle, Info, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BasicClubAnalytics } from '@/lib/api/clubManagement';

interface PerformanceIndicatorsProps {
  analytics: BasicClubAnalytics;
}

const PerformanceIndicators: React.FC<PerformanceIndicatorsProps> = ({ analytics }) => {
  const getEngagementStatus = (score: number) => {
    if (score >= 70) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        badge: { variant: "default" as const, className: "bg-green-100 text-green-800", text: "Excellent" }
      };
    } else if (score >= 40) {
      return {
        icon: <Info className="h-5 w-5 text-yellow-600" />,
        badge: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800", text: "Good" }
      };
    } else {
      return {
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        badge: { variant: "secondary" as const, className: "bg-red-100 text-red-800", text: "Needs Attention" }
      };
    }
  };

  const getActivityTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'stable':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  const engagementStatus = getEngagementStatus(analytics.memberMetrics.engagementScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {engagementStatus.icon}
            <Badge 
              variant={engagementStatus.badge.variant}
              className={engagementStatus.badge.className}
            >
              {engagementStatus.badge.text}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {analytics.memberMetrics.activeMembersThisWeek} of {analytics.memberMetrics.totalMembers} members active
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discussion Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-5 w-5 ${getActivityTrendColor(analytics.discussionMetrics.activityTrend)}`} />
            <Badge variant="outline">
              {analytics.discussionMetrics.activityTrend}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {analytics.discussionMetrics.averagePostsPerTopic} posts per topic average
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reading Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <Badge variant="outline">Coming Soon</Badge>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Reading tracking in Phase 4
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceIndicators;
