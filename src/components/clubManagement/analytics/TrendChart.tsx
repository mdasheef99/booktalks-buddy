/**
 * Trend Chart Component
 * 
 * Displays analytics trends over time with simple chart visualization.
 * Phase 2 Week 4 implementation.
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAnalyticsTrends } from '@/lib/api/clubManagement';

interface TrendChartProps {
  clubId: string;
  period: 'week' | 'month' | 'year';
}

interface TrendData {
  memberGrowth: number[];
  activityTrends: number[];
  engagementMetrics: { date: string; score: number }[];
}

const TrendChart: React.FC<TrendChartProps> = ({ clubId, period }) => {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getAnalyticsTrends(clubId, period);
        setTrendData(data);
      } catch (err) {
        console.error('Error fetching trends:', err);
        setError('Failed to load trend data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [clubId, period]);

  const calculateTrend = (data: number[]): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const previous = data.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
    
    if (recent > previous * 1.05) return 'up';
    if (recent < previous * 0.95) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderSimpleChart = (data: number[], label: string, color: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-20 flex items-center justify-center text-gray-400">
          No data available
        </div>
      );
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-1">
            {getTrendIcon(calculateTrend(data))}
            <Badge variant="outline" className={getTrendColor(calculateTrend(data))}>
              {calculateTrend(data)}
            </Badge>
          </div>
        </div>
        <div className="h-16 flex items-end gap-1">
          {data.slice(-10).map((value, index) => {
            const height = range > 0 ? ((value - min) / range) * 100 : 50;
            return (
              <div
                key={index}
                className={`flex-1 ${color} rounded-t transition-all duration-300`}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${label}: ${value}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <BarChart3 className="h-8 w-8 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!trendData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <BarChart3 className="h-8 w-8 mb-2" />
        <p className="text-sm">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Growth Trend */}
      <Card>
        <CardContent className="p-4">
          {renderSimpleChart(trendData.memberGrowth, 'Member Growth', 'bg-blue-500')}
        </CardContent>
      </Card>

      {/* Activity Trend */}
      <Card>
        <CardContent className="p-4">
          {renderSimpleChart(trendData.activityTrends, 'Discussion Activity', 'bg-green-500')}
        </CardContent>
      </Card>

      {/* Engagement Trend */}
      <Card>
        <CardContent className="p-4">
          {renderSimpleChart(
            trendData.engagementMetrics.map(e => e.score), 
            'Engagement Score', 
            'bg-purple-500'
          )}
        </CardContent>
      </Card>

      {/* Period Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          📊 {period.charAt(0).toUpperCase() + period.slice(1)} Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-900">Member Growth</div>
            <div className="text-blue-700 flex items-center gap-1">
              {getTrendIcon(calculateTrend(trendData.memberGrowth))}
              {calculateTrend(trendData.memberGrowth)} trend
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-900">Activity Level</div>
            <div className="text-blue-700 flex items-center gap-1">
              {getTrendIcon(calculateTrend(trendData.activityTrends))}
              {calculateTrend(trendData.activityTrends)} trend
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-900">Engagement</div>
            <div className="text-blue-700 flex items-center gap-1">
              {getTrendIcon(calculateTrend(trendData.engagementMetrics.map(e => e.score)))}
              {calculateTrend(trendData.engagementMetrics.map(e => e.score))} trend
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Charts Coming Soon */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-2">🚀 Advanced Charts Coming Soon</h4>
        <div className="text-sm text-purple-700">
          <p>Future enhancements will include:</p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Interactive line charts with zoom and pan</li>
            <li>Comparative period overlays</li>
            <li>Seasonal pattern analysis</li>
            <li>Predictive trend forecasting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
