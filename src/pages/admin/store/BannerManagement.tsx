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
import { Megaphone, Plus, Eye, Settings, Calendar } from 'lucide-react';
import { toast } from 'sonner';

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
            <Megaphone className="h-4 w-4" />
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
          <Card>
            <CardHeader>
              <CardTitle>Banner Analytics</CardTitle>
              <CardDescription>
                Track banner performance and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Banner analytics coming soon...</p>
                <p className="text-sm mt-2">Click-through rates, impressions, and conversion tracking</p>
              </div>
            </CardContent>
          </Card>
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
