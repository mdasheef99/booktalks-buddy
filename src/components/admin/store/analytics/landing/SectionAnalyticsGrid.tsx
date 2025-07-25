import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Type, BookOpen, Megaphone } from 'lucide-react';

interface SectionAnalyticsGridProps {
  enhancedAnalytics: any;
}

/**
 * Section Analytics Grid component for Landing Page Analytics
 * Displays performance metrics for different sections of the landing page
 */
export const SectionAnalyticsGrid: React.FC<SectionAnalyticsGridProps> = ({
  enhancedAnalytics
}) => {
  if (!enhancedAnalytics) {
    return null;
  }

  return (
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
            <span className="font-medium">
              {enhancedAnalytics?.heroAnalytics?.customQuoteViews || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Chat Button CTR</span>
            <span className="font-medium">
              {enhancedAnalytics?.heroAnalytics?.chatButtonCTR?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Section Engagement</span>
            <span className="font-medium">
              {enhancedAnalytics?.heroAnalytics?.heroEngagementRate?.toFixed(1) || 0}%
            </span>
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
            <span className="font-medium">
              {enhancedAnalytics?.carouselAnalytics?.totalBookClicks || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Interaction Rate</span>
            <span className="font-medium">
              {enhancedAnalytics?.carouselAnalytics?.carouselInteractionRate?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Average Time Spent</span>
            <span className="font-medium">
              {Math.round(enhancedAnalytics?.carouselAnalytics?.avgTimeOnCarousel || 0)}s
            </span>
          </div>
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
            Promotional banner effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Banner Views</span>
            <span className="font-medium">
              {enhancedAnalytics?.bannerAnalytics?.totalBannerViews || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Click-through Rate</span>
            <span className="font-medium">
              {enhancedAnalytics?.bannerAnalytics?.overallClickThroughRate?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Conversion Rate</span>
            <span className="font-medium">
              {enhancedAnalytics?.bannerAnalytics?.conversionRate?.toFixed(1) || 0}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Community Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Community Showcase
          </CardTitle>
          <CardDescription>
            Community section engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Section Views</span>
            <span className="font-medium">
              {enhancedAnalytics?.communityAnalytics?.sectionViews || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Interaction Rate</span>
            <span className="font-medium">
              {enhancedAnalytics?.communityAnalytics?.communityInteractionRate?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Testimonial Clicks</span>
            <span className="font-medium">
              {enhancedAnalytics?.communityAnalytics?.testimonialClicks || 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
