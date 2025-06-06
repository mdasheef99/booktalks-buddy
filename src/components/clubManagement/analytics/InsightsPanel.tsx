/**
 * Insights Panel Component
 * 
 * Displays AI-generated insights and recommendations based on analytics data.
 * Phase 2 Week 4 implementation.
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle, AlertTriangle, Info, TrendingUp, Users, MessageSquare, Book } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getEnhancedAnalytics, AnalyticsInsight, BasicClubAnalytics } from '@/lib/api/clubManagement';

interface InsightsPanelProps {
  clubId: string;
  analytics: BasicClubAnalytics;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ clubId, analytics }) => {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);

      try {
        const enhancedAnalytics = await getEnhancedAnalytics(clubId);
        setInsights(enhancedAnalytics.insights);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to load insights');
        // Generate fallback insights based on basic analytics
        setInsights(generateFallbackInsights(analytics));
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [clubId, analytics]);

  const generateFallbackInsights = (analytics: BasicClubAnalytics): AnalyticsInsight[] => {
    const insights: AnalyticsInsight[] = [];

    // Member engagement insights
    if (analytics.memberMetrics.engagementScore >= 70) {
      insights.push({
        type: 'positive',
        category: 'members',
        title: 'Excellent Member Engagement',
        description: `${analytics.memberMetrics.engagementScore}% of members are actively participating`,
        recommendation: 'Keep up the great work! Consider sharing success strategies with other clubs.'
      });
    } else if (analytics.memberMetrics.engagementScore < 30) {
      insights.push({
        type: 'warning',
        category: 'members',
        title: 'Low Member Engagement',
        description: `Only ${analytics.memberMetrics.engagementScore}% of members are actively participating`,
        recommendation: 'Try hosting interactive events or discussion prompts to boost engagement.'
      });
    }

    // Discussion insights
    if (analytics.discussionMetrics.averagePostsPerTopic >= 10) {
      insights.push({
        type: 'positive',
        category: 'discussions',
        title: 'Vibrant Discussions',
        description: `Average of ${analytics.discussionMetrics.averagePostsPerTopic} posts per topic shows great engagement`,
        recommendation: 'Your discussion topics are resonating well with members!'
      });
    } else if (analytics.discussionMetrics.averagePostsPerTopic < 3) {
      insights.push({
        type: 'warning',
        category: 'discussions',
        title: 'Limited Discussion Activity',
        description: `Only ${analytics.discussionMetrics.averagePostsPerTopic} posts per topic on average`,
        recommendation: 'Try asking thought-provoking questions or sharing interesting quotes to spark discussion.'
      });
    }

    // Growth insights
    if (analytics.memberMetrics.totalMembers < 5) {
      insights.push({
        type: 'neutral',
        category: 'members',
        title: 'Growing Your Club',
        description: 'Your club is still small but has potential for growth',
        recommendation: 'Consider inviting friends or promoting your club in book-loving communities.'
      });
    }

    return insights;
  };

  const getInsightIcon = (type: string, category: string) => {
    if (type === 'positive') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (type === 'warning' || type === 'critical') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    
    switch (category) {
      case 'members':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'discussions':
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'books':
        return <Book className="h-5 w-5 text-orange-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const displayedInsights = showAll ? insights : insights.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Analytics Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Analytics Insights
        </CardTitle>
        <CardDescription>
          AI-powered recommendations based on your club's data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}. Showing basic insights based on available data.
            </AlertDescription>
          </Alert>
        )}

        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-8 w-8 mx-auto mb-2" />
            <p>No insights available yet. More data needed for analysis.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type, insight.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <Badge variant="outline" className={getInsightBadgeColor(insight.type)}>
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    {insight.recommendation && (
                      <div className="bg-blue-50 rounded-md p-2">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Recommendation:</strong> {insight.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {insights.length > 3 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show ${insights.length - 3} More Insights`}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Insight Categories Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Insight Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="font-medium text-blue-900">Members</div>
              <div className="text-blue-700">
                {insights.filter(i => i.category === 'members').length} insights
              </div>
            </div>
            <div className="text-center">
              <MessageSquare className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <div className="font-medium text-purple-900">Discussions</div>
              <div className="text-purple-700">
                {insights.filter(i => i.category === 'discussions').length} insights
              </div>
            </div>
            <div className="text-center">
              <Book className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <div className="font-medium text-orange-900">Books</div>
              <div className="text-orange-700">
                {insights.filter(i => i.category === 'books').length} insights
              </div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="font-medium text-green-900">Engagement</div>
              <div className="text-green-700">
                {insights.filter(i => i.category === 'engagement').length} insights
              </div>
            </div>
          </div>
        </div>

        {/* AI Enhancement Notice */}
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-900">AI-Powered Insights</div>
              <div className="text-yellow-800">
                These insights are generated based on your club's activity patterns and best practices from successful book clubs.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;
