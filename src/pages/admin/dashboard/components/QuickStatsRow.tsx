import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  BookMarked, 
  Activity, 
  Crown, 
  Star, 
  Users, 
  BookOpen, 
  MessageSquare 
} from 'lucide-react';
import { QuickStatsRowProps } from '../types';
import { calculateClubsWithBooksPercentage } from '../utils/statsCalculations';

/**
 * Component for the secondary statistics row
 */
const QuickStatsRow: React.FC<QuickStatsRowProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Recent Activity Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-bookconnect-sage" />
            Recent Activity (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                New Users
              </span>
              <span className="font-medium">{stats.recentActivity.newUsers}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center">
                <BookOpen className="h-3 w-3 mr-1 text-muted-foreground" />
                New Clubs
              </span>
              <span className="font-medium">{stats.recentActivity.newClubs}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1 text-muted-foreground" />
                New Discussions
              </span>
              <span className="font-medium">{stats.recentActivity.newDiscussions}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Activity Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <BookMarked className="h-4 w-4 mr-2 text-bookconnect-sage" />
            Reading Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Books in Progress</span>
              <span className="font-medium">{stats.booksInProgress}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Clubs with Books</span>
              <span className="font-medium">{stats.clubsWithCurrentBook}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Activity Rate</span>
              <span className="font-medium">
                {calculateClubsWithBooksPercentage(stats.clubsWithCurrentBook, stats.totalClubs)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2 text-bookconnect-sage" />
            Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Avg. Members/Club</span>
              <span className="font-medium">{stats.avgMembersPerClub}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Avg. Discussions/Club</span>
              <span className="font-medium">{stats.avgDiscussionsPerClub}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Active Discussions</span>
              <span className="font-medium">{stats.activeDiscussions || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Tiers Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Crown className="h-4 w-4 mr-2 text-bookconnect-sage" />
            User Tiers
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Free</span>
              <span className="font-medium">
                {stats.tierDistribution.free}
                <span className="text-xs text-muted-foreground ml-1">
                  ({Math.round((stats.tierDistribution.free / stats.totalUsers) * 100)}%)
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center">
                Privileged <Star className="h-3 w-3 ml-1 text-bookconnect-sage" />
              </span>
              <span className="font-medium">
                {stats.tierDistribution.privileged}
                <span className="text-xs text-muted-foreground ml-1">
                  ({Math.round((stats.tierDistribution.privileged / stats.totalUsers) * 100)}%)
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center">
                Privileged+ <Crown className="h-3 w-3 ml-1 text-bookconnect-terracotta" />
              </span>
              <span className="font-medium">
                {stats.tierDistribution.privileged_plus}
                <span className="text-xs text-muted-foreground ml-1">
                  ({Math.round((stats.tierDistribution.privileged_plus / stats.totalUsers) * 100)}%)
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStatsRow;
