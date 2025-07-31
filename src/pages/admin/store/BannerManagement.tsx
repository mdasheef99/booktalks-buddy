import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { BannersAPI, PromotionalBanner } from '@/lib/api/store/banners';
import { BannerManagementGrid } from '@/components/admin/store/banners/BannerManagementGrid';
import { BannerPreview } from '@/components/admin/store/banners/BannerPreview';
import { BannerEntryModal } from '@/components/admin/store/banners/BannerEntryModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Plus, Eye, Settings, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

// Banner Analytics Components
import { AnalyticsPageLayout, AnalyticsPageHeader, TimeRangeSelector, AnalyticsErrorBoundary } from '@/components/admin/store/analytics/shared';
import {
  BannerAnalyticsGrid,
  MultiBannerPerformanceTable,
  BannerComparisonChart,
  BannerTimeSeriesChart,
  BannerInsightsSection
} from '@/components/admin/store/analytics/banner';
import { useBannerAnalytics } from '@/hooks/analytics';

/**
 * Banner Management Page for Store Owners
 * Provides complete interface for managing promotional banners
 */
export const BannerManagement: React.FC = () => {
  const { storeId } = useStoreOwnerContext();
  const queryClient = useQueryClient();

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [activeTab, setActiveTab] = useState('manage');
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState(30);

  // Banner Analytics Hook
  const {
    summary,
    bannerPerformance,
    timeSeriesData,
    comparisonData,
    isLoading: analyticsLoading,
    hasErrors: analyticsHasErrors,
    timeRange,
    setTimeRange,
    refetchAll: refetchAnalytics,
    exportData,
    isExporting
  } = useBannerAnalytics({
    storeId,
    initialTimeRange: analyticsTimeRange
  });

  // Fetch promotional banners
  const {
    data: banners = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-banners-admin', storeId],
    queryFn: () => BannersAPI.getBanners(storeId),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (bannerId: string) => BannersAPI.deleteBanner(bannerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-banners-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-promotional-banners', storeId] });
      toast.success('Banner deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (banners: { id: string; priority_order: number }[]) => 
      BannersAPI.reorderBanners(storeId, banners),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-banners-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-promotional-banners', storeId] });
      toast.success('Banner order updated');
    },
    onError: (error) => {
      console.error('Error reordering banners:', error);
      toast.error('Failed to update banner order');
    }
  });

  const handleAddBanner = () => {
    setEditingBanner(null);
    setShowEntryModal(true);
  };

  const handleEditBanner = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setShowEntryModal(true);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (window.confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      deleteMutation.mutate(bannerId);
    }
  };

  const handleReorderBanners = (banners: { id: string; priority_order: number }[]) => {
    reorderMutation.mutate(banners);
  };

  const handleModalClose = () => {
    setShowEntryModal(false);
    setEditingBanner(null);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['store-banners-admin', storeId] });
    queryClient.invalidateQueries({ queryKey: ['store-promotional-banners', storeId] });
    handleModalClose();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading banner management..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Megaphone className="h-4 w-4" />
          <AlertDescription>
            Failed to load promotional banners. Please try refreshing the page.
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
          <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage promotional banners for your landing page
          </p>
        </div>
        
        <Button
          onClick={handleAddBanner}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Banner
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Manage Banners Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promotional Banners ({banners.length})</CardTitle>
              <CardDescription>
                Create and manage marketing banners for your store. Banners are displayed in priority order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BannerManagementGrid
                banners={banners}
                onEdit={handleEditBanner}
                onDelete={handleDeleteBanner}
                onReorder={handleReorderBanners}
                onAdd={handleAddBanner}
                isReordering={reorderMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banner Preview</CardTitle>
              <CardDescription>
                See how your banners will appear on the landing page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BannerPreview banners={banners} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banner Scheduling</CardTitle>
              <CardDescription>
                View and manage banner schedules and activation dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Banner scheduling interface coming soon...</p>
                <p className="text-sm mt-2">Visual calendar for banner planning and scheduling</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsPageLayout>
            <AnalyticsPageHeader
              title="Banner Analytics"
              description="Track banner performance and engagement metrics"
            >
              <div className="flex items-center gap-3">
                <TimeRangeSelector
                  value={timeRange}
                  onChange={setTimeRange}
                  options={[
                    { label: '7 days', value: 7 },
                    { label: '30 days', value: 30 },
                    { label: '90 days', value: 90 }
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchAnalytics}
                  disabled={analyticsLoading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('json')}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>
              </div>
            </AnalyticsPageHeader>

            {/* Analytics Error State */}
            {analyticsHasErrors && (
              <Alert>
                <AlertDescription>
                  There was an error loading analytics data. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            )}

            {/* Analytics Dashboard */}
            <AnalyticsErrorBoundary>
              <div className="space-y-8">
                {/* Overview Metrics Grid */}
                <BannerAnalyticsGrid
                  summary={summary}
                  isLoading={analyticsLoading}
                />

                {/* Performance Table and Comparison Chart */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <MultiBannerPerformanceTable
                    bannerPerformance={bannerPerformance}
                    isLoading={analyticsLoading}
                    maxRows={5}
                    showDeviceBreakdown={true}
                  />

                  <BannerComparisonChart
                    comparisonData={comparisonData}
                    isLoading={analyticsLoading}
                    maxBanners={5}
                  />
                </div>

                {/* Time Series Chart */}
                <BannerTimeSeriesChart
                  timeSeriesData={timeSeriesData}
                  isLoading={analyticsLoading}
                  chartHeight={350}
                />

                {/* AI Insights */}
                <BannerInsightsSection
                  summary={summary}
                  bannerPerformance={bannerPerformance}
                  isLoading={analyticsLoading}
                />
              </div>
            </AnalyticsErrorBoundary>
          </AnalyticsPageLayout>
        </TabsContent>
      </Tabs>

      {/* Banner Entry Modal */}
      {showEntryModal && (
        <BannerEntryModal
          isOpen={showEntryModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          storeId={storeId}
          editingBanner={editingBanner}
        />
      )}
    </div>
  );
};

export default BannerManagement;
