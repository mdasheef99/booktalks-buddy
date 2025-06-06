/**
 * Comparative Metrics Component
 *
 * Displays comparative analytics across different time periods.
 * Phase 2 Week 4 implementation.
 */

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEnhancedAnalytics, BasicClubAnalytics } from '@/lib/api/clubManagement';
import ComparisonCard from './components/ComparisonCard';
import BenchmarkComparison from './components/BenchmarkComparison';
import ComparisonInsights from './components/ComparisonInsights';

interface ComparativeMetricsProps {
  clubId: string;
  analytics: BasicClubAnalytics;
}

const ComparativeMetrics: React.FC<ComparativeMetricsProps> = ({ clubId, analytics }) => {
  const [comparativeData, setComparativeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparativeData = async () => {
      setLoading(true);
      setError(null);

      try {
        const enhancedAnalytics = await getEnhancedAnalytics(clubId);
        setComparativeData(enhancedAnalytics.comparativePeriods);
      } catch (err) {
        console.error('Error fetching comparative data:', err);
        setError('Failed to load comparative data');
        // Generate fallback data
        setComparativeData({
          previousWeek: {},
          previousMonth: {},
          yearOverYear: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComparativeData();
  }, [clubId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Comparative Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const weeklyData = comparativeData?.previousWeek?.memberMetrics;
  const monthlyData = comparativeData?.previousMonth?.memberMetrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Comparative Analysis
        </CardTitle>
        <CardDescription>
          Compare current metrics with previous periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Week over Week</TabsTrigger>
            <TabsTrigger value="monthly">Month over Month</TabsTrigger>
            <TabsTrigger value="yearly">Year over Year</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            {weeklyData ? (
              <div className="space-y-3">
                <ComparisonCard
                  title="Total Members"
                  current={analytics.memberMetrics.totalMembers}
                  previous={weeklyData.totalMembers || 0}
                />
                <ComparisonCard
                  title="Active Members"
                  current={analytics.memberMetrics.activeMembersThisWeek}
                  previous={weeklyData.activeMembersThisWeek || 0}
                />
                <ComparisonCard
                  title="Engagement Score"
                  current={analytics.memberMetrics.engagementScore}
                  previous={weeklyData.engagementScore || 0}
                  unit="%"
                />
                <ComparisonCard
                  title="Discussion Topics"
                  current={analytics.discussionMetrics.totalTopics}
                  previous={0} // Placeholder - would come from weekly discussion data
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p>No weekly comparison data available yet</p>
                <p className="text-sm">Data will be available after one week of activity</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            {monthlyData ? (
              <div className="space-y-3">
                <ComparisonCard
                  title="Total Members"
                  current={analytics.memberMetrics.totalMembers}
                  previous={monthlyData.totalMembers || 0}
                />
                <ComparisonCard
                  title="Active Members"
                  current={analytics.memberMetrics.activeMembersThisWeek}
                  previous={monthlyData.activeMembersThisWeek || 0}
                />
                <ComparisonCard
                  title="Engagement Score"
                  current={analytics.memberMetrics.engagementScore}
                  previous={monthlyData.engagementScore || 0}
                  unit="%"
                />
                <ComparisonCard
                  title="Discussion Topics"
                  current={analytics.discussionMetrics.totalTopics}
                  previous={0} // Placeholder - would come from monthly discussion data
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p>No monthly comparison data available yet</p>
                <p className="text-sm">Data will be available after one month of activity</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>Year-over-year comparison coming soon</p>
              <p className="text-sm">This feature will be available after one year of data collection</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Comparison Insights */}
        <div className="mt-6 space-y-4">
          <ComparisonInsights analytics={analytics} />

          {/* Benchmark Comparison */}
          <BenchmarkComparison analytics={analytics} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparativeMetrics;
