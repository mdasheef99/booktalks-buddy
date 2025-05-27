/**
 * Benchmark Comparison Component
 *
 * Compares club metrics against typical benchmarks.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BasicClubAnalytics } from '@/lib/api/clubManagement';

interface BenchmarkComparisonProps {
  analytics: BasicClubAnalytics;
}

const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({ analytics }) => {
  const getBenchmarkStatus = (value: number, threshold: number, type: 'higher' | 'lower' = 'higher') => {
    const isGood = type === 'higher' ? value >= threshold : value <= threshold;
    return {
      status: isGood ? 'good' : 'improving',
      className: isGood ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
      text: isGood ? (type === 'higher' ? 'Above Average' : 'Below Average') : 'Improving'
    };
  };

  const engagementBenchmark = getBenchmarkStatus(analytics.memberMetrics.engagementScore, 50);
  const postsBenchmark = getBenchmarkStatus(analytics.discussionMetrics.averagePostsPerTopic, 5);
  const sizeBenchmark = analytics.memberMetrics.totalMembers >= 10 
    ? { status: 'good', className: 'bg-green-100 text-green-800', text: 'Healthy' }
    : { status: 'growing', className: 'bg-blue-100 text-blue-800', text: 'Growing' };

  return (
    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
      <h5 className="font-medium text-purple-900 mb-2">📊 Benchmark Comparison</h5>
      <div className="text-sm text-purple-800">
        <p className="mb-2">How your club compares to typical book clubs:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center justify-between">
            <span>Engagement Rate:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{analytics.memberMetrics.engagementScore}%</span>
              <Badge className={engagementBenchmark.className}>
                {engagementBenchmark.text}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Posts per Topic:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{analytics.discussionMetrics.averagePostsPerTopic}</span>
              <Badge className={postsBenchmark.className}>
                {postsBenchmark.text}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Club Size:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{analytics.memberMetrics.totalMembers}</span>
              <Badge className={sizeBenchmark.className}>
                {sizeBenchmark.text}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkComparison;
