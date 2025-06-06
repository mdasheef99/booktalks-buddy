/**
 * Discussion Metrics Card Component
 * 
 * Displays discussion-related analytics including topics,
 * posts, and engagement metrics.
 */

import React from 'react';
import { MessageSquare, MessageCircle, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DiscussionMetrics {
  totalTopics: number;
  totalPosts: number;
  postsThisWeek: number;
  averagePostsPerTopic: number;
}

interface DiscussionMetricsCardProps {
  metrics?: DiscussionMetrics;
  loading?: boolean;
  detailed?: boolean;
}

const DiscussionMetricsCard: React.FC<DiscussionMetricsCardProps> = ({
  metrics,
  loading = false,
  detailed = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion Metrics
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

  const totalTopics = metrics?.totalTopics || 0;
  const totalPosts = metrics?.totalPosts || 0;
  const postsThisWeek = metrics?.postsThisWeek || 0;
  const averagePostsPerTopic = metrics?.averagePostsPerTopic || 0;

  // Calculate activity level
  const getActivityLevel = () => {
    if (averagePostsPerTopic >= 10) return { level: 'High', color: 'text-green-600', bg: 'bg-green-50' };
    if (averagePostsPerTopic >= 5) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const activityLevel = getActivityLevel();

  // Calculate engagement score (0-100)
  const engagementScore = Math.min(100, Math.round((averagePostsPerTopic / 15) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion Metrics
        </CardTitle>
        <CardDescription>
          Topic and post activity statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Topics */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalTopics}</div>
            <div className="text-sm text-gray-600">Discussion Topics</div>
          </div>
          <Badge variant="outline" className={`${activityLevel.bg} ${activityLevel.color} border-current`}>
            {activityLevel.level} Activity
          </Badge>
        </div>

        {/* Posts Per Topic */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Avg Posts per Topic</span>
            <span className="text-sm font-bold text-purple-600">{averagePostsPerTopic}</span>
          </div>
          <Progress value={engagementScore} className="h-2" />
          <div className="text-xs text-gray-500">
            {engagementScore}% engagement score
          </div>
        </div>

        {/* Total Posts */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Total Posts</span>
          </div>
          <span className="text-lg font-bold text-purple-900">{totalPosts}</span>
        </div>

        {/* Detailed View */}
        {detailed && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-gray-900">Discussion Breakdown</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-gray-900">{totalTopics}</div>
                <div className="text-gray-600">Topics</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-gray-900">{totalPosts}</div>
                <div className="text-gray-600">Posts</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h5 className="font-medium text-blue-900">This Week</h5>
              </div>
              <div className="text-sm text-blue-800">
                <p>{postsThisWeek} new posts this week</p>
                {postsThisWeek > 0 && (
                  <p className="text-xs mt-1">
                    That's {Math.round((postsThisWeek / 7) * 10) / 10} posts per day on average
                  </p>
                )}
              </div>
            </div>

            {/* Discussion Insights */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-1">💡 Discussion Insights</h5>
              <div className="text-sm text-yellow-800">
                {averagePostsPerTopic >= 10 && (
                  <p>Great discussion engagement! Members are actively participating.</p>
                )}
                {averagePostsPerTopic >= 5 && averagePostsPerTopic < 10 && (
                  <p>Good discussion activity. Consider discussion prompts to boost engagement.</p>
                )}
                {averagePostsPerTopic < 5 && totalTopics > 0 && (
                  <p>Low discussion activity. Try asking thought-provoking questions.</p>
                )}
                {totalTopics === 0 && (
                  <p>No discussions yet. Start your first topic to get conversations going!</p>
                )}
              </div>
            </div>

            {/* Topic Categories (Placeholder for Week 4) */}
            <div className="p-3 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-900 mb-1">📊 Topic Analysis</h5>
              <div className="text-sm text-green-800">
                <p>Advanced topic analysis coming in Week 4</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Most popular discussion topics</li>
                  <li>• Peak discussion times</li>
                  <li>• Member participation patterns</li>
                </ul>
              </div>
            </div>

            {/* Engagement Tips */}
            <div className="p-3 bg-indigo-50 rounded-lg">
              <h5 className="font-medium text-indigo-900 mb-1">🚀 Boost Engagement</h5>
              <div className="text-sm text-indigo-800">
                <ul className="space-y-1">
                  <li>• Ask open-ended questions about characters</li>
                  <li>• Share interesting quotes or passages</li>
                  <li>• Create polls about plot predictions</li>
                  <li>• Encourage personal connections to the story</li>
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
                <div className="font-medium text-gray-900">New Topic</div>
                <div className="text-gray-600">Start discussion</div>
              </button>
              <button className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">View All</div>
                <div className="text-gray-600">See discussions</div>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscussionMetricsCard;
