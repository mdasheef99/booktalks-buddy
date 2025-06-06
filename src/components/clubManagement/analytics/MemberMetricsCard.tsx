/**
 * Member Metrics Card Component
 * 
 * Displays member-related analytics including total members,
 * active members, and growth indicators.
 */

import React from 'react';
import { Users, UserPlus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MemberMetrics {
  totalMembers: number;
  activeMembersThisWeek: number;
  newMembersThisMonth: number;
  memberGrowthTrend: number[];
}

interface MemberMetricsCardProps {
  metrics?: MemberMetrics;
  loading?: boolean;
  detailed?: boolean;
}

const MemberMetricsCard: React.FC<MemberMetricsCardProps> = ({
  metrics,
  loading = false,
  detailed = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalMembers = metrics?.totalMembers || 0;
  const activeMembers = metrics?.activeMembersThisWeek || 0;
  const newMembers = metrics?.newMembersThisMonth || 0;
  
  // Calculate engagement rate
  const engagementRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
  
  // Determine trend (placeholder for Phase 2 Week 4)
  const trendDirection = 'stable'; // Will be calculated from memberGrowthTrend in Week 4
  
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Member Metrics
        </CardTitle>
        <CardDescription>
          Member activity and growth statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Members */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm ${getTrendColor()}`}>
              {trendDirection === 'stable' ? 'Stable' : `${Math.abs(5)}%`}
            </span>
          </div>
        </div>

        {/* Active Members This Week */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Active This Week</span>
            <span className="text-sm font-bold text-green-600">{activeMembers}</span>
          </div>
          <Progress value={engagementRate} className="h-2" />
          <div className="text-xs text-gray-500">
            {engagementRate}% engagement rate
          </div>
        </div>

        {/* New Members This Month */}
        {detailed && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">New This Month</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              +{newMembers}
            </Badge>
          </div>
        )}

        {/* Detailed View */}
        {detailed && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-gray-900">Member Breakdown</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-gray-900">{activeMembers}</div>
                <div className="text-gray-600">Active</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-gray-900">{totalMembers - activeMembers}</div>
                <div className="text-gray-600">Inactive</div>
              </div>
            </div>

            {/* Engagement Insights */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-1">💡 Insights</h5>
              <div className="text-sm text-yellow-800">
                {engagementRate >= 70 && (
                  <p>Excellent engagement! Your members are very active.</p>
                )}
                {engagementRate >= 40 && engagementRate < 70 && (
                  <p>Good engagement. Consider hosting events to boost activity.</p>
                )}
                {engagementRate < 40 && (
                  <p>Low engagement. Try discussion prompts or book selection polls.</p>
                )}
              </div>
            </div>

            {/* Growth Trend Placeholder */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-1">📈 Growth Trend</h5>
              <div className="text-sm text-blue-800">
                <p>Advanced trend analysis coming in Week 4</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Historical growth patterns</li>
                  <li>• Seasonal activity trends</li>
                  <li>• Member retention rates</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions (for detailed view) */}
        {detailed && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">Invite Members</div>
                <div className="text-gray-600">Grow your club</div>
              </button>
              <button className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">Member List</div>
                <div className="text-gray-600">View all members</div>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberMetricsCard;
