import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { CommunityShowcaseAPI } from '@/lib/api/store/communityShowcase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Star, MessageCircle, Settings, Eye, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

// Import admin components (to be created)
import { MemberSpotlightManager } from '@/components/admin/store/community/MemberSpotlightManager';
import { TestimonialManager } from '@/components/admin/store/community/TestimonialManager';
import { CommunityMetricsConfig } from '@/components/admin/store/community/CommunityMetricsConfig';
import { CommunityShowcasePreview } from '@/components/admin/store/community/CommunityShowcasePreview';

/**
 * Community Showcase Management Page for Store Owners
 * Provides complete interface for managing community features
 */
export const CommunityShowcaseManagement: React.FC = () => {
  const { storeId } = useStoreOwnerContext();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('spotlights');

  // Fetch showcase data
  const {
    data: showcaseData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['community-showcase-admin', storeId],
    queryFn: () => CommunityShowcaseAPI.getCommunityShowcaseData(storeId),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => CommunityShowcaseAPI.updateShowcaseSettings(storeId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-showcase-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['community-showcase', storeId] });
      queryClient.invalidateQueries({ queryKey: ['showcase-settings', storeId] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    },
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['community-showcase', storeId] });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading community showcase..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load community showcase data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const settings = showcaseData?.showcaseSettings || {
    show_member_spotlights: false,
    show_testimonials: false,
    show_activity_feed: false,
    show_community_metrics: false,
    max_spotlights_display: 3,
    activity_feed_limit: 5,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Showcase</h1>
          <p className="text-gray-600">
            Manage member spotlights, testimonials, and community features for your landing page
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Refresh Preview
        </Button>
      </div>

      {/* Quick Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Settings
          </CardTitle>
          <CardDescription>
            Enable or disable community showcase features on your landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show_member_spotlights"
                checked={settings.show_member_spotlights}
                onChange={(e) => updateSettingsMutation.mutate({ show_member_spotlights: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="show_member_spotlights" className="text-sm font-medium">
                Member Spotlights
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show_testimonials"
                checked={settings.show_testimonials}
                onChange={(e) => updateSettingsMutation.mutate({ show_testimonials: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="show_testimonials" className="text-sm font-medium">
                Testimonials
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show_activity_feed"
                checked={settings.show_activity_feed}
                onChange={(e) => updateSettingsMutation.mutate({ show_activity_feed: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="show_activity_feed" className="text-sm font-medium">
                Activity Feed
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show_community_metrics"
                checked={settings.show_community_metrics}
                onChange={(e) => updateSettingsMutation.mutate({ show_community_metrics: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="show_community_metrics" className="text-sm font-medium">
                Community Metrics
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spotlights" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Member Spotlights
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics & Activity
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Member Spotlights Tab */}
        <TabsContent value="spotlights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Spotlights ({showcaseData?.memberSpotlights.length || 0})</CardTitle>
              <CardDescription>
                Feature community members to showcase your active and engaged readers.
                Spotlights help build trust and encourage new members to join.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberSpotlightManager
                storeId={storeId}
                spotlights={showcaseData?.memberSpotlights || []}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Testimonials ({showcaseData?.testimonials.length || 0})</CardTitle>
              <CardDescription>
                Collect and manage customer testimonials to build social proof and trust.
                Testimonials can be manually added or imported from reviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestimonialManager
                storeId={storeId}
                testimonials={showcaseData?.testimonials || []}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics & Activity Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Metrics & Activity</CardTitle>
              <CardDescription>
                View community statistics and configure which metrics to display on your landing page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommunityMetricsConfig
                metrics={showcaseData?.communityMetrics}
                activities={showcaseData?.activityFeed || []}
                settings={settings}
                onSettingsUpdate={(newSettings) => updateSettingsMutation.mutate(newSettings)}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <CommunityShowcasePreview
            storeId={storeId}
            showcaseData={showcaseData}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
