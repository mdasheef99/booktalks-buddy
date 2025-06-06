/**
 * Comparison Insights Component
 *
 * Displays insights based on comparative analytics data.
 */

import React from 'react';
import { BasicClubAnalytics } from '@/lib/api/clubManagement';

interface ComparisonInsightsProps {
  analytics: BasicClubAnalytics;
}

const ComparisonInsights: React.FC<ComparisonInsightsProps> = ({ analytics }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">📈 Comparison Insights</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Growth Patterns</h5>
          <div className="text-sm text-blue-800">
            {analytics.memberMetrics.totalMembers > 0 ? (
              <p>Your club has {analytics.memberMetrics.totalMembers} members with {analytics.memberMetrics.engagementScore}% engagement rate.</p>
            ) : (
              <p>Start tracking growth patterns as your club develops.</p>
            )}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h5 className="font-medium text-green-900 mb-2">Activity Trends</h5>
          <div className="text-sm text-green-800">
            {analytics.discussionMetrics.totalTopics > 0 ? (
              <p>Discussion activity shows {analytics.discussionMetrics.averagePostsPerTopic} posts per topic on average.</p>
            ) : (
              <p>Activity trends will appear as discussions develop.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonInsights;
