import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';
import { DashboardStats, TrendDirection } from '../types';

interface UserStatsCardProps {
  stats: DashboardStats;
  className?: string;
}

/**
 * Specialized card component for displaying user statistics with enhanced visualizations
 */
const UserStatsCard: React.FC<UserStatsCardProps> = ({ stats, className = '' }) => {
  // Calculate percentage of new users relative to total
  const calculateNewUserPercentage = (): number => {
    if (!stats.totalUsers || stats.totalUsers === 0 || !stats.newUsersInRange) {
      return 0;
    }
    return (stats.newUsersInRange / stats.totalUsers) * 100;
  };

  // Determine growth trend direction and percentage
  const getUserGrowthTrend = (): { direction: TrendDirection; percentage: number } => {
    if (!stats.growthRates?.users) {
      return { direction: 'neutral', percentage: 0 };
    }
    
    const growthRate = stats.growthRates.users;
    
    if (growthRate > 0) {
      return { direction: 'up', percentage: growthRate };
    } else if (growthRate < 0) {
      return { direction: 'down', percentage: Math.abs(growthRate) };
    } else {
      return { direction: 'neutral', percentage: 0 };
    }
  };

  // Format growth trend for display
  const formatGrowthTrend = (): string => {
    const { direction, percentage } = getUserGrowthTrend();
    if (direction === 'neutral') return 'No change';
    
    const prefix = direction === 'up' ? '+' : '-';
    return `${prefix}${percentage.toFixed(1)}% from previous period`;
  };

  // Get color class based on trend direction
  const getTrendColorClass = (direction: TrendDirection): string => {
    switch (direction) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      case 'neutral':
      default:
        return 'text-gray-500';
    }
  };

  // Render trend arrow based on direction
  const renderTrendArrow = (direction: TrendDirection) => {
    const colorClass = getTrendColorClass(direction);
    
    if (direction === 'up') {
      return <span className={`${colorClass} text-lg`}>↑</span>;
    } else if (direction === 'down') {
      return <span className={`${colorClass} text-lg`}>↓</span>;
    }
    return <span className={`${colorClass} text-lg`}>→</span>;
  };

  // Calculate new user percentage for progress bar
  const newUserPercentage = calculateNewUserPercentage();
  const { direction } = getUserGrowthTrend();
  const trendColorClass = getTrendColorClass(direction);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Total Users</CardTitle>
          <Users className="h-6 w-6 text-bookconnect-terracotta opacity-80" />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Main metric with trend indicator */}
        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold mr-2">
              {stats.totalUsers !== undefined ? stats.totalUsers : 'N/A'}
            </span>
            {renderTrendArrow(direction)}
          </div>
          
          <div className={`text-sm ${trendColorClass} mt-1`}>
            {formatGrowthTrend()}
          </div>
        </div>
        
        {/* New users section */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-1">New Users (this period)</div>
          <div className="flex justify-between items-baseline mb-1">
            <span>{stats.newUsersInRange || 0} new users</span>
            <span className="text-xs text-muted-foreground">
              ({newUserPercentage.toFixed(1)}% of total)
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
            <div 
              className="bg-bookconnect-sage h-2.5 rounded-full" 
              style={{ width: `${newUserPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Trend visualization */}
        {stats.userAcquisition?.trend && stats.userAcquisition.trend.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center text-sm font-medium mb-2">
              <TrendingUp className="h-4 w-4 mr-1 text-bookconnect-sage" />
              <span>User Growth Trend</span>
            </div>
            
            <div className="flex h-12 items-end space-x-1">
              {stats.userAcquisition.trend.map((value, index) => {
                // Normalize height (max 40px)
                const max = Math.max(...stats.userAcquisition!.trend);
                const height = max > 0 ? (value / max) * 40 : 0;
                
                return (
                  <div 
                    key={index}
                    className="bg-bookconnect-sage/70 rounded-t w-full"
                    style={{ height: `${height}px` }}
                  ></div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 pb-3">
        <div className="text-xs text-muted-foreground">
          Avg: {stats.userAcquisition?.averagePerWeek || 0} new users/week
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserStatsCard;
