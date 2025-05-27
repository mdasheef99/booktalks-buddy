/**
 * Health Score Card Component
 *
 * Displays the club's overall health score with visual indicators.
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BasicClubAnalytics } from '@/lib/api/clubManagement';

interface HealthScoreCardProps {
  analytics: BasicClubAnalytics;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ analytics }) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10b981'; // green
    if (score >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Club Health Score
        </CardTitle>
        <CardDescription>
          Overall assessment of your club's performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
            <div 
              className="absolute inset-0 rounded-full border-8 border-green-500 border-t-transparent transform -rotate-90"
              style={{
                borderTopColor: getScoreColor(analytics.memberMetrics.engagementScore)
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.memberMetrics.engagementScore}
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">
              {analytics.memberMetrics.totalMembers}
            </div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {analytics.discussionMetrics.totalTopics}
            </div>
            <div className="text-sm text-gray-600">Topics</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {analytics.discussionMetrics.averagePostsPerTopic}
            </div>
            <div className="text-sm text-gray-600">Avg Posts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthScoreCard;
