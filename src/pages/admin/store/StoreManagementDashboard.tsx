import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { CarouselAPI } from '@/lib/api/store/carousel';
import { BannersAPI } from '@/lib/api/store/banners';
import { QuotesAPI } from '@/lib/api/store/quotes';
import { CommunityShowcaseAPI } from '@/lib/api/store/communityShowcase';
import { HeroCustomizationAPI } from '@/lib/api/store/heroCustomization';
import { AnalyticsAPI } from '@/lib/api/store/analytics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Megaphone,
  Quote,
  Users,
  Settings,
  BarChart3,
  Plus,
  Eye,
  ArrowRight,
  Activity,
  Calendar,
  TrendingUp,
  Type
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Store Management Dashboard - Central hub for Store Owners
 * Provides overview of all Store Management features with quick navigation
 */
export const StoreManagementDashboard: React.FC = () => {
  const { storeId } = useStoreOwnerContext();

  // Fetch data for all sections to show statistics
  const {
    data: carouselItems = [],
    isLoading: carouselLoading
  } = useQuery({
    queryKey: ['store-carousel-admin', storeId],
    queryFn: () => CarouselAPI.getCarouselItems(storeId),
    staleTime: 60 * 1000, // 1 minute
  });

  const {
    data: banners = [],
    isLoading: bannersLoading
  } = useQuery({
    queryKey: ['store-banners-admin', storeId],
    queryFn: () => BannersAPI.getBanners(storeId),
    staleTime: 60 * 1000,
  });

  const {
    data: quotes = [],
    isLoading: quotesLoading
  } = useQuery({
    queryKey: ['store-quotes-admin', storeId],
    queryFn: () => QuotesAPI.getStoreQuotes(storeId),
    staleTime: 60 * 1000,
  });

  const {
    data: showcaseData,
    isLoading: showcaseLoading
  } = useQuery({
    queryKey: ['community-showcase-admin', storeId],
    queryFn: () => CommunityShowcaseAPI.getCommunityShowcaseData(storeId),
    staleTime: 60 * 1000,
  });

  const {
    data: heroCustomization,
    isLoading: heroLoading
  } = useQuery({
    queryKey: ['hero-customization', storeId],
    queryFn: () => HeroCustomizationAPI.getHeroCustomizationWithDefaults(storeId),
    staleTime: 60 * 1000,
  });

  const {
    data: analyticsMetrics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['simple-analytics-metrics', storeId],
    queryFn: () => AnalyticsAPI.getSimpleMetrics(storeId),
    staleTime: 60 * 1000,
  });

  const isLoading = carouselLoading || bannersLoading || quotesLoading || showcaseLoading || heroLoading || analyticsLoading;

  // Calculate statistics
  const stats = {
    carousel: {
      total: carouselItems.length,
      active: carouselItems.filter(item => item.is_active).length,
      max: 6
    },
    banners: {
      total: banners.length,
      active: banners.filter(banner => banner.is_active).length
    },
    quotes: {
      total: quotes.length,
      active: quotes.filter(quote => quote.is_active).length
    },
    community: {
      spotlights: showcaseData?.memberSpotlights?.length || 0,
      testimonials: showcaseData?.testimonials?.length || 0,
      activities: showcaseData?.activityFeed?.length || 0
    },
    hero: {
      hasCustomQuote: !!(heroCustomization?.sections_enabled?.hero_quote && heroCustomization?.hero_quote),
      chatButtonEnabled: heroCustomization?.is_chat_button_enabled || false
    }
  };

  // Quick action items
  const quickActions = [
    {
      title: 'Customize Hero',
      description: 'Add custom quote and chat button',
      icon: Type,
      href: '/admin/store-management/hero',
      disabled: false,
      color: 'bg-indigo-500'
    },
    {
      title: 'Add Book to Carousel',
      description: 'Feature a new book in your carousel',
      icon: BookOpen,
      href: '/admin/store-management/carousel',
      disabled: stats.carousel.total >= 6,
      color: 'bg-blue-500'
    },
    {
      title: 'Create Banner',
      description: 'Add a promotional banner',
      icon: Megaphone,
      href: '/admin/store-management/banners',
      disabled: false,
      color: 'bg-orange-500'
    },
    {
      title: 'Add Quote',
      description: 'Create an inspirational quote',
      icon: Quote,
      href: '/admin/store-management/quotes',
      disabled: false,
      color: 'bg-green-500'
    },
    {
      title: 'Manage Community',
      description: 'Configure community showcase',
      icon: Users,
      href: '/admin/store-management/community',
      disabled: false,
      color: 'bg-purple-500'
    }
  ];

  // Management sections
  const managementSections = [
    {
      title: 'Hero Customization',
      description: 'Customize hero section quotes and chat button',
      icon: Type,
      href: '/admin/store-management/hero',
      stats: stats.hero.hasCustomQuote ? 'Custom quote active' : 'Using defaults',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Carousel Management',
      description: 'Manage your featured books carousel',
      icon: BookOpen,
      href: '/admin/store-management/carousel',
      stats: `${stats.carousel.active}/${stats.carousel.max} books`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Banner Management',
      description: 'Create and manage promotional banners',
      icon: Megaphone,
      href: '/admin/store-management/banners',
      stats: `${stats.banners.active} active banners`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Quote Management',
      description: 'Manage inspirational quotes',
      icon: Quote,
      href: '/admin/store-management/quotes',
      stats: `${stats.quotes.active} active quotes`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Community Showcase',
      description: 'Feature community members and testimonials',
      icon: Users,
      href: '/admin/store-management/community',
      stats: `${stats.community.spotlights} spotlights`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Management Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your landing page customization and content
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
            asChild
            className="flex items-center gap-2"
          >
            <Link to="/admin/store-management/analytics">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Carousel Books</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.carousel.active}/{stats.carousel.max}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Banners</p>
                <p className="text-2xl font-bold text-gray-900">{stats.banners.active}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.quotes.active}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Quote className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Community Features</p>
                <p className="text-2xl font-bold text-gray-900">{stats.community.spotlights}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsMetrics?.pageViews || 0}
                </p>
                <p className="text-xs text-gray-500">
                  Last 7 days • {analyticsMetrics?.hasData ? 'Active' : 'No data'}
                </p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Quickly add new content to your landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                disabled={action.disabled}
              >
                <Link to={action.href}>
                  <div className={`h-8 w-8 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Management Sections and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Management Sections */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Management Sections
              </CardTitle>
              <CardDescription>
                Access all Store Management features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {managementSections.map((section) => (
                  <Card key={section.title} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 ${section.bgColor} rounded-lg flex items-center justify-center`}>
                            <section.icon className={`h-6 w-6 ${section.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{section.title}</h3>
                            <p className="text-sm text-gray-600">{section.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{section.stats}</p>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={section.href}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Status */}
        <div className="space-y-6">
          {/* Landing Page Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Landing Page Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Hero Section</span>
                <span className={`text-sm font-medium ${stats.hero.hasCustomQuote ? 'text-green-600' : 'text-gray-400'}`}>
                  {stats.hero.hasCustomQuote ? 'Customized' : 'Default'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Carousel</span>
                <span className={`text-sm font-medium ${stats.carousel.active > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {stats.carousel.active > 0 ? 'Active' : 'Empty'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Banners</span>
                <span className={`text-sm font-medium ${stats.banners.active > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {stats.banners.active > 0 ? `${stats.banners.active} Active` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quotes</span>
                <span className={`text-sm font-medium ${stats.quotes.active > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {stats.quotes.active > 0 ? `${stats.quotes.active} Active` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Community</span>
                <span className={`text-sm font-medium ${stats.community.spotlights > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {stats.community.spotlights > 0 ? `${stats.community.spotlights} Features` : 'None'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!stats.hero.hasCustomQuote && (
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-800">
                    Customize your hero section with a personal quote
                  </p>
                </div>
              )}
              {stats.carousel.active === 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Add books to your carousel to showcase featured titles
                  </p>
                </div>
              )}
              {stats.banners.active === 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">
                    Create promotional banners to highlight special offers
                  </p>
                </div>
              )}
              {stats.quotes.active === 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Add inspirational quotes to engage your visitors
                  </p>
                </div>
              )}
              {stats.community.spotlights === 0 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    Feature community members to build social proof
                  </p>
                </div>
              )}
              {stats.hero.hasCustomQuote && stats.carousel.active > 0 && stats.banners.active > 0 && stats.quotes.active > 0 && stats.community.spotlights > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    🎉 Excellent! All sections are fully configured. Check analytics to see performance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
