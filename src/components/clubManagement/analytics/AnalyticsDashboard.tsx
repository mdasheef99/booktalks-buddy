/**
 * Analytics Dashboard Component
 *
 * Main analytics dashboard for club management.
 * Displays member metrics, discussion activity, and book progress.
 */

import React, { useState } from 'react';
import { BarChart3, Users, MessageSquare, Book, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClubAnalytics } from '@/hooks/useClubManagement';
import { AnalyticsErrorBoundary } from '@/components/clubManagement/ClubManagementErrorBoundary';
import MemberMetricsCard from './MemberMetricsCard';
import DiscussionMetricsCard from './DiscussionMetricsCard';
import BookMetricsCard from './BookMetricsCard';
import AnalyticsLoadingSkeleton from './AnalyticsLoadingSkeleton';
import EnhancedAnalyticsDashboard from './EnhancedAnalyticsDashboard';

interface AnalyticsDashboardProps {
  clubId: string;
  canViewAnalytics?: boolean;
  isClubLead?: boolean;
}

/**
 * Analytics Dashboard Component
 */
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  clubId,
  canViewAnalytics = true,
  isClubLead = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [useEnhanced, setUseEnhanced] = useState(true);
  const { analytics, loading, error, refresh, lastUpdated } = useClubAnalytics(clubId);

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh analytics:', err);
    }
  };

  // Permission check
  if (!canViewAnalytics) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Access Required</h3>
          <p className="text-gray-600 text-center max-w-md">
            You need analytics access to view club statistics. Please contact your club lead for permission.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <AnalyticsErrorBoundary clubId={clubId}>
        <AnalyticsLoadingSkeleton />
      </AnalyticsErrorBoundary>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-red-600 text-center max-w-md mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Use enhanced dashboard for Phase 2 Week 4
  if (useEnhanced) {
    return (
      <EnhancedAnalyticsDashboard
        clubId={clubId}
        canViewAnalytics={canViewAnalytics}
        isClubLead={isClubLead}
      />
    );
  }

  return (
    <AnalyticsErrorBoundary clubId={clubId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Club Analytics
            </h2>
            <p className="text-gray-600 mt-1">
              Insights and metrics for your book club
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="discussions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Discussions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MemberMetricsCard
                metrics={analytics?.memberMetrics}
                loading={loading}
              />
              <DiscussionMetricsCard
                metrics={analytics?.discussionMetrics}
                loading={loading}
              />
              <BookMetricsCard
                metrics={analytics?.bookMetrics}
                loading={loading}
              />
            </div>

            {/* Quick Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Summary
                </CardTitle>
                <CardDescription>
                  Key metrics at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.memberMetrics.totalMembers || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.memberMetrics.activeMembersThisWeek || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics?.discussionMetrics.totalTopics || 0}
                    </div>
                    <div className="text-sm text-gray-600">Discussion Topics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics?.discussionMetrics.averagePostsPerTopic || 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg Posts/Topic</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phase 2 Features Coming Soon */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">🚀 Enhanced Analytics Coming Soon</CardTitle>
                <CardDescription className="text-blue-700">
                  Week 4 will bring advanced features and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">📊 Advanced Metrics</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Member engagement scores</li>
                      <li>• Reading completion rates</li>
                      <li>• Activity trend analysis</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">🔧 Enhanced Features</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Data export (PDF/CSV)</li>
                      <li>• Historical comparisons</li>
                      <li>• Performance optimization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <MemberMetricsCard
              metrics={analytics?.memberMetrics}
              loading={loading}
              detailed={true}
            />
          </TabsContent>

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="space-y-6">
            <DiscussionMetricsCard
              metrics={analytics?.discussionMetrics}
              loading={loading}
              detailed={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AnalyticsErrorBoundary>
  );
};

export default AnalyticsDashboard;
