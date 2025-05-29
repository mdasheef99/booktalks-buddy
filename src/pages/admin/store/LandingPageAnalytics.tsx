import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { AnalyticsAPI, PerformanceAlert, BasicRecommendation, EnhancedAnalytics, SectionAnalytics } from '@/lib/api/store/analytics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  MousePointer,
  Clock,
  Users,
  Lightbulb,
  Target,
  Zap,
  Type,
  BookOpen,
  Megaphone
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Landing Page Analytics Dashboard - Basic Performance Alerts Only
 * Reduced scope implementation focusing on essential insights
 */
export const LandingPageAnalytics: React.FC = () => {
  const { storeId } = useStoreOwnerContext();

  // Fetch enhanced analytics
  const {
    data: enhancedAnalytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['enhanced-analytics', storeId],
    queryFn: () => AnalyticsAPI.getEnhancedAnalytics(storeId, 30),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const analyticsSummary = enhancedAnalytics?.summary;

  // Fetch performance alerts
  const {
    data: performanceAlerts = [],
    isLoading: alertsLoading
  } = useQuery({
    queryKey: ['performance-alerts', storeId],
    queryFn: () => AnalyticsAPI.getPerformanceAlerts(storeId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch basic recommendations
  const {
    data: recommendations = [],
    isLoading: recommendationsLoading
  } = useQuery({
    queryKey: ['basic-recommendations', storeId],
    queryFn: () => AnalyticsAPI.getBasicRecommendations(storeId),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = analyticsLoading || alertsLoading || recommendationsLoading;

  // Alert type styling
  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertBadgeVariant = (priority: PerformanceAlert['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRecommendationIcon = (category: BasicRecommendation['category']) => {
    switch (category) {
      case 'content': return <Target className="h-4 w-4 text-blue-500" />;
      case 'engagement': return <Users className="h-4 w-4 text-green-500" />;
      case 'performance': return <Zap className="h-4 w-4 text-orange-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  // Error state
  if (analyticsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load analytics data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Landing Page Analytics</h1>
          <p className="text-gray-600 mt-2">
            Basic performance insights and recommendations for your landing page
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link to="/">
              <Eye className="h-4 w-4" />
              View Landing Page
            </Link>
          </Button>

          <Button
            onClick={() => refetchAnalytics()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Enhanced Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsSummary?.totalPageViews || 0}
                </p>
                <p className="text-xs text-gray-500">{analyticsSummary?.period}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsSummary?.totalUniqueVisitors || 0}
                </p>
                <p className="text-xs text-gray-500">Individual users</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chat Clicks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsSummary?.totalChatClicks || 0}
                </p>
                <p className="text-xs text-gray-500">Button interactions</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MousePointer className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Return Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analyticsSummary?.returnVisitorRate || 0)}%
                </p>
                <p className="text-xs text-gray-500">Returning visitors</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mobile Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsSummary?.mobileVsDesktopRatio.mobile || 0}%
                </p>
                <p className="text-xs text-gray-500">vs {analyticsSummary?.mobileVsDesktopRatio.desktop || 0}% desktop</p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analyticsSummary?.averageTimeOnPage || 0)}s
                </p>
                <p className="text-xs text-gray-500">Time on page</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Performance Alerts
          </CardTitle>
          <CardDescription>
            Automated insights about your landing page performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performanceAlerts.length > 0 ? (
            <div className="space-y-4">
              {performanceAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <Badge variant={getAlertBadgeVariant(alert.priority)}>
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    {alert.recommendation && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        💡 {alert.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No performance alerts at this time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Improvement Recommendations
          </CardTitle>
          <CardDescription>
            Simple suggestions to enhance your landing page performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getRecommendationIcon(rec.category)}
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {rec.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <p className="text-sm font-medium text-blue-600">
                    Action: {rec.action}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recommendations available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section-Specific Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hero Section Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Hero Section Performance
            </CardTitle>
            <CardDescription>
              Custom quote and chat button analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quote Views</span>
              <span className="font-medium">{enhancedAnalytics?.heroAnalytics.customQuoteViews || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Chat Button CTR</span>
              <span className="font-medium">{enhancedAnalytics?.heroAnalytics.chatButtonClickRate.toFixed(1) || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hero Engagement</span>
              <span className="font-medium">{enhancedAnalytics?.heroAnalytics.heroEngagementRate.toFixed(1) || 0}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Carousel Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Carousel Performance
            </CardTitle>
            <CardDescription>
              Book carousel interaction analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Book Clicks</span>
              <span className="font-medium">{enhancedAnalytics?.carouselAnalytics.totalBookClicks || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Interaction Rate</span>
              <span className="font-medium">{enhancedAnalytics?.carouselAnalytics.carouselInteractionRate.toFixed(1) || 0}%</span>
            </div>
            {enhancedAnalytics?.carouselAnalytics.mostPopularBooks && enhancedAnalytics.carouselAnalytics.mostPopularBooks.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Most Popular Books:</p>
                <div className="space-y-1">
                  {enhancedAnalytics.carouselAnalytics.mostPopularBooks.slice(0, 3).map((book, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{book.bookTitle}</span>
                      <span className="font-medium">{book.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banner Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Banner Performance
            </CardTitle>
            <CardDescription>
              Promotional banner analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Impressions</span>
              <span className="font-medium">{enhancedAnalytics?.bannerAnalytics.totalImpressions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Click-Through Rate</span>
              <span className="font-medium">{enhancedAnalytics?.bannerAnalytics.clickThroughRate.toFixed(1) || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Clicks</span>
              <span className="font-medium">{analyticsSummary?.totalBannerClicks || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Community Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Performance
            </CardTitle>
            <CardDescription>
              Community showcase analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Spotlight Views</span>
              <span className="font-medium">{enhancedAnalytics?.communityAnalytics.spotlightViews || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Testimonial Engagement</span>
              <span className="font-medium">{enhancedAnalytics?.communityAnalytics.testimonialEngagement.toFixed(1) || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Community Interaction</span>
              <span className="font-medium">{enhancedAnalytics?.communityAnalytics.communityInteractionRate.toFixed(1) || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Analytics Data Collection</h4>
              <p className="text-sm text-blue-800">
                Analytics data is collected automatically as visitors interact with your landing page.
                Data may take 24-48 hours to appear for new stores. This dashboard shows basic
                performance insights and recommendations only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
