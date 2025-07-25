import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Target, Info } from 'lucide-react';

interface InsightsSectionProps {
  insights?: {
    insights: string[];
    recommendations: string[];
  };
}

/**
 * Insights Section component for Book Club Analytics
 * Displays automated insights and recommendations
 */
export const InsightsSection: React.FC<InsightsSectionProps> = ({
  insights
}) => {
  if (!insights) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Key Insights
          </CardTitle>
          <CardDescription>
            Automated insights about your book club community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.insights.length > 0 ? (
            <div className="space-y-3">
              {insights.insights.map((insight, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No insights available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Suggestions to improve your book club engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.recommendations.length > 0 ? (
            <div className="space-y-3">
              {insights.recommendations.map((recommendation, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                >
                  <Target className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recommendations at this time</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
