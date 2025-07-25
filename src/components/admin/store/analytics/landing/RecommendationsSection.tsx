import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Users, Zap, Lightbulb } from 'lucide-react';
import type { BasicRecommendation } from '@/lib/api/store/analytics/';

interface RecommendationsSectionProps {
  recommendations: BasicRecommendation[];
}

/**
 * Recommendations Section component for Landing Page Analytics
 * Displays actionable recommendations to improve landing page performance
 */
export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations
}) => {
  const getRecommendationIcon = (category: BasicRecommendation['category']) => {
    switch (category) {
      case 'content': return <Target className="h-4 w-4 text-blue-500" />;
      case 'engagement': return <Users className="h-4 w-4 text-green-500" />;
      case 'performance': return <Zap className="h-4 w-4 text-orange-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: BasicRecommendation['category']) => {
    switch (category) {
      case 'content': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'engagement': return 'bg-green-50 text-green-700 border-green-200';
      case 'performance': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recommendations
        </CardTitle>
        <CardDescription>
          Actionable suggestions to improve your landing page performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-3 p-4 border rounded-lg ${getCategoryColor(recommendation.category)}`}
              >
                {getRecommendationIcon(recommendation.category)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {recommendation.category}
                    </Badge>
                  </div>
                  <p className="text-sm">{recommendation.description}</p>
                  {recommendation.impact && (
                    <p className="text-xs mt-1 font-medium">
                      Expected impact: {recommendation.impact}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recommendations available</p>
            <p className="text-sm">Your landing page is optimized</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
