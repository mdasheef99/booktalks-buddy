/**
 * Enhanced Analytics Dashboard Component
 *
 * Advanced analytics dashboard with trends, insights, and export functionality.
 * Phase 2 Week 4 implementation.
 */

import React, { useState } from 'react';
import { BarChart3, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClubAnalytics } from '@/hooks/useClubManagement';
import { AnalyticsErrorBoundary } from '@/components/clubManagement/ClubManagementErrorBoundary';
import TrendChart from './TrendChart';
import InsightsPanel from './InsightsPanel';
import ComparativeMetrics from './ComparativeMetrics';
import HealthScoreCard from './components/HealthScoreCard';
import ExportControls from './components/ExportControls';
import PerformanceIndicators from './components/PerformanceIndicators';

interface EnhancedAnalyticsDashboardProps {
  clubId: string;
  canViewAnalytics?: boolean;
  isClubLead?: boolean;
}

/**
 * Enhanced Analytics Dashboard Component
 */
const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({
  clubId,
  canViewAnalytics = true,
  isClubLead = false
}) => {
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [exportError, setExportError] = useState<string | null>(null);

  const { analytics, loading, error, refresh, lastUpdated } = useClubAnalytics(clubId);

  const handleExportError = (error: string) => {
    setExportError(error);
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
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AnalyticsErrorBoundary>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-red-600 text-center max-w-md mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <AnalyticsErrorBoundary clubId={clubId}>
      <div className="space-y-6">
        {/* Header with Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Enhanced Analytics
            </h2>
            <p className="text-gray-600 mt-1">
              Advanced insights and trends for your book club
            </p>
          </div>

          <ExportControls
            clubId={clubId}
            isClubLead={isClubLead}
            lastUpdated={lastUpdated}
            onExportError={handleExportError}
          />
        </div>

        {/* Export Error */}
        {exportError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}

        {/* Health Score Overview */}
        <HealthScoreCard analytics={analytics} />

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                  Activity trends over time
                </CardDescription>
              </div>
              <Select value={trendPeriod} onValueChange={(value: 'week' | 'month' | 'year') => setTrendPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart clubId={clubId} period={trendPeriod} />
          </CardContent>
        </Card>

        {/* Insights Panel */}
        <InsightsPanel clubId={clubId} analytics={analytics} />

        {/* Comparative Metrics */}
        <ComparativeMetrics clubId={clubId} analytics={analytics} />

        {/* Performance Indicators */}
        <PerformanceIndicators analytics={analytics} />
      </div>
    </AnalyticsErrorBoundary>
  );
};

export default EnhancedAnalyticsDashboard;
