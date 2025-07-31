/**
 * Banner Insights Section Component
 * 
 * AI-generated recommendations and insights for banner optimization
 * Provides actionable recommendations based on performance data
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Users,
  Clock,
  Smartphone,
  Monitor,
  ArrowRight,
  Star
} from 'lucide-react';
import { formatCTR, formatNumber } from '@/lib/api/store/bannerAnalytics';
import type { 
  MultiBannerAnalyticsSummary, 
  BannerPerformanceDetail 
} from '@/lib/api/store/bannerAnalytics';

// =========================
// Component Props Interface
// =========================

interface BannerInsightsSectionProps {
  summary: MultiBannerAnalyticsSummary | undefined;
  bannerPerformance: BannerPerformanceDetail[];
  isLoading: boolean;
  className?: string;
  onImplementRecommendation?: (recommendationId: string) => void;
}

// =========================
// Insight Types
// =========================

interface Insight {
  id: string;
  type: 'optimization' | 'warning' | 'success' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  icon: React.ReactNode;
  data?: any;
}

interface PerformanceMetrics {
  avgCTR: number;
  topPerformerCTR: number;
  worstPerformerCTR: number;
  totalImpressions: number;
  totalClicks: number;
  bannerCount: number;
}

// =========================
// Insight Generation Logic
// =========================

/**
 * Generate insights based on banner performance data
 */
const generateInsights = (
  summary: MultiBannerAnalyticsSummary,
  bannerPerformance: BannerPerformanceDetail[]
): Insight[] => {
  const insights: Insight[] = [];
  
  // Calculate performance metrics
  const metrics: PerformanceMetrics = {
    avgCTR: summary.avgCTRAllBanners,
    topPerformerCTR: Math.max(...bannerPerformance.map(b => b.ctr), 0),
    worstPerformerCTR: Math.min(...bannerPerformance.map(b => b.ctr), 0),
    totalImpressions: summary.totalImpressions,
    totalClicks: summary.totalClicks,
    bannerCount: summary.activeBannersCount
  };

  // 1. Overall Performance Assessment
  if (metrics.avgCTR < 2) {
    insights.push({
      id: 'low-overall-ctr',
      type: 'warning',
      priority: 'high',
      title: 'Low Overall Click-Through Rate',
      description: `Your average CTR of ${formatCTR(metrics.avgCTR)} is below industry standards (2-5%).`,
      recommendation: 'Review banner content, positioning, and targeting to improve engagement.',
      impact: 'Could increase clicks by 50-150%',
      icon: <TrendingDown className="h-5 w-5" />
    });
  } else if (metrics.avgCTR > 5) {
    insights.push({
      id: 'excellent-ctr',
      type: 'success',
      priority: 'low',
      title: 'Excellent Performance',
      description: `Your average CTR of ${formatCTR(metrics.avgCTR)} exceeds industry benchmarks.`,
      recommendation: 'Maintain current strategy and consider scaling successful banners.',
      impact: 'Continue strong performance',
      icon: <CheckCircle className="h-5 w-5" />
    });
  }

  // 2. Banner Performance Disparity
  const ctrRange = metrics.topPerformerCTR - metrics.worstPerformerCTR;
  if (ctrRange > 5 && bannerPerformance.length > 1) {
    const topBanner = bannerPerformance.find(b => b.ctr === metrics.topPerformerCTR);
    const worstBanner = bannerPerformance.find(b => b.ctr === metrics.worstPerformerCTR);
    
    insights.push({
      id: 'performance-disparity',
      type: 'opportunity',
      priority: 'medium',
      title: 'Significant Performance Variation',
      description: `Large gap between best (${formatCTR(metrics.topPerformerCTR)}) and worst (${formatCTR(metrics.worstPerformerCTR)}) performing banners.`,
      recommendation: `Analyze what makes "${topBanner?.bannerTitle}" successful and apply those elements to underperforming banners.`,
      impact: 'Could improve overall CTR by 20-40%',
      icon: <Target className="h-5 w-5" />,
      data: { topBanner: topBanner?.bannerTitle, worstBanner: worstBanner?.bannerTitle }
    });
  }

  // 3. Device Performance Analysis
  const deviceAnalysis = bannerPerformance.reduce((acc, banner) => {
    acc.mobile += banner.deviceBreakdown.mobile;
    acc.desktop += banner.deviceBreakdown.desktop;
    acc.tablet += banner.deviceBreakdown.tablet;
    return acc;
  }, { mobile: 0, desktop: 0, tablet: 0 });

  const totalDeviceInteractions = deviceAnalysis.mobile + deviceAnalysis.desktop + deviceAnalysis.tablet;
  if (totalDeviceInteractions > 0) {
    const mobilePercentage = (deviceAnalysis.mobile / totalDeviceInteractions) * 100;
    
    if (mobilePercentage > 70) {
      insights.push({
        id: 'mobile-optimization',
        type: 'optimization',
        priority: 'medium',
        title: 'Mobile-First Audience',
        description: `${mobilePercentage.toFixed(1)}% of banner interactions come from mobile devices.`,
        recommendation: 'Ensure banners are optimized for mobile viewing with larger text and touch-friendly elements.',
        impact: 'Could improve mobile CTR by 15-25%',
        icon: <Smartphone className="h-5 w-5" />
      });
    } else if (mobilePercentage < 30) {
      insights.push({
        id: 'desktop-focus',
        type: 'optimization',
        priority: 'low',
        title: 'Desktop-Heavy Traffic',
        description: `${(100 - mobilePercentage).toFixed(1)}% of interactions come from desktop/tablet devices.`,
        recommendation: 'Consider desktop-specific banner designs with more detailed content and smaller text.',
        impact: 'Could improve desktop engagement by 10-20%',
        icon: <Monitor className="h-5 w-5" />
      });
    }
  }

  // 4. View Duration Analysis
  const avgViewDuration = bannerPerformance.reduce((sum, b) => sum + b.avgViewDuration, 0) / bannerPerformance.length;
  if (avgViewDuration < 3) {
    insights.push({
      id: 'low-engagement-time',
      type: 'warning',
      priority: 'medium',
      title: 'Short Engagement Time',
      description: `Average view duration of ${avgViewDuration.toFixed(1)} seconds suggests low engagement.`,
      recommendation: 'Use more compelling visuals, clearer value propositions, or interactive elements.',
      impact: 'Could increase engagement time by 50-100%',
      icon: <Clock className="h-5 w-5" />
    });
  }

  // 5. Banner Quantity Optimization
  if (metrics.bannerCount > 5) {
    insights.push({
      id: 'too-many-banners',
      type: 'warning',
      priority: 'medium',
      title: 'Banner Overload',
      description: `${metrics.bannerCount} active banners may overwhelm users and dilute attention.`,
      recommendation: 'Consider reducing to 3-5 top-performing banners for better focus and conversion.',
      impact: 'Could improve individual banner CTR by 20-30%',
      icon: <AlertTriangle className="h-5 w-5" />
    });
  } else if (metrics.bannerCount < 2) {
    insights.push({
      id: 'limited-testing',
      type: 'opportunity',
      priority: 'low',
      title: 'Limited A/B Testing',
      description: 'Only one banner limits your ability to test and optimize performance.',
      recommendation: 'Create 2-3 banner variations to test different messages, designs, or offers.',
      impact: 'Could discover 25-50% better performing variants',
      icon: <Target className="h-5 w-5" />
    });
  }

  // 6. Impression Volume Analysis
  if (metrics.totalImpressions < 1000) {
    insights.push({
      id: 'low-visibility',
      type: 'opportunity',
      priority: 'high',
      title: 'Low Banner Visibility',
      description: `Only ${formatNumber(metrics.totalImpressions)} impressions suggests limited exposure.`,
      recommendation: 'Increase banner placement visibility, improve SEO, or consider paid promotion.',
      impact: 'Could increase impressions by 200-500%',
      icon: <Users className="h-5 w-5" />
    });
  }

  // Sort insights by priority
  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// =========================
// Utility Functions
// =========================

const getInsightTypeConfig = (type: Insight['type']) => {
  switch (type) {
    case 'warning':
      return { 
        bgColor: 'bg-red-50', 
        borderColor: 'border-red-200', 
        iconColor: 'text-red-600',
        badgeVariant: 'destructive' as const
      };
    case 'opportunity':
      return { 
        bgColor: 'bg-blue-50', 
        borderColor: 'border-blue-200', 
        iconColor: 'text-blue-600',
        badgeVariant: 'default' as const
      };
    case 'optimization':
      return { 
        bgColor: 'bg-yellow-50', 
        borderColor: 'border-yellow-200', 
        iconColor: 'text-yellow-600',
        badgeVariant: 'outline' as const
      };
    case 'success':
      return { 
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-200', 
        iconColor: 'text-green-600',
        badgeVariant: 'secondary' as const
      };
    default:
      return { 
        bgColor: 'bg-gray-50', 
        borderColor: 'border-gray-200', 
        iconColor: 'text-gray-600',
        badgeVariant: 'outline' as const
      };
  }
};

const getPriorityBadge = (priority: Insight['priority']) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
    case 'medium':
      return <Badge variant="outline" className="text-xs">Medium Priority</Badge>;
    case 'low':
      return <Badge variant="secondary" className="text-xs">Low Priority</Badge>;
    default:
      return null;
  }
};

// =========================
// Loading Component
// =========================

const LoadingInsights: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// =========================
// Main Component
// =========================

/**
 * Banner Insights Section
 * Provides AI-generated recommendations and insights
 */
export const BannerInsightsSection: React.FC<BannerInsightsSectionProps> = ({
  summary,
  bannerPerformance,
  isLoading,
  className = '',
  onImplementRecommendation
}) => {
  // Generate insights
  const insights = useMemo(() => {
    if (!summary || bannerPerformance.length === 0) return [];
    return generateInsights(summary, bannerPerformance);
  }, [summary, bannerPerformance]);

  // Show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingInsights />
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Looking Good!</h3>
            <p className="text-gray-500">
              No specific recommendations at this time. Keep monitoring your banner performance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Performance Insights
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              AI-generated recommendations to optimize your banner performance
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => {
            const config = getInsightTypeConfig(insight.type);
            
            return (
              <div
                key={insight.id}
                className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-white ${config.iconColor}`}>
                    {insight.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">
                      {insight.description}
                    </p>
                    
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Recommendation:
                          </p>
                          <p className="text-sm text-gray-700">
                            {insight.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Potential Impact:</span> {insight.impact}
                      </div>
                      
                      {onImplementRecommendation && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onImplementRecommendation(insight.id)}
                          className="text-xs h-7"
                        >
                          Learn More
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">High Priority:</span>
              <div className="font-medium text-red-600">
                {insights.filter(i => i.priority === 'high').length} issue{insights.filter(i => i.priority === 'high').length !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Opportunities:</span>
              <div className="font-medium text-blue-600">
                {insights.filter(i => i.type === 'opportunity').length} found
              </div>
            </div>
            <div>
              <span className="text-gray-600">Optimizations:</span>
              <div className="font-medium text-yellow-600">
                {insights.filter(i => i.type === 'optimization').length} suggested
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BannerInsightsSection;
