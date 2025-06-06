import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { CarouselAPI, CarouselItem } from '@/lib/api/store/carousel';
import { BookManagementGrid } from '@/components/admin/store/carousel/BookManagementGrid';
import { CarouselPreview } from '@/components/admin/store/carousel/CarouselPreview';
import { BookEntryModal } from '@/components/admin/store/carousel/BookEntryModal';
import { BookSearchInterface } from '@/components/admin/store/carousel/BookSearchInterface';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, Search, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Carousel Management Page for Store Owners
 * Provides complete interface for managing featured books carousel
 */
export const CarouselManagement: React.FC = () => {
  const { storeId } = useStoreOwnerContext();
  const queryClient = useQueryClient();
  
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showSearchInterface, setShowSearchInterface] = useState(false);
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [activeTab, setActiveTab] = useState('manage');

  // Fetch carousel items
  const {
    data: carouselItems = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-carousel-admin', storeId],
    queryFn: () => CarouselAPI.getCarouselItems(storeId),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => CarouselAPI.deleteCarouselItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-carousel-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-carousel', storeId] });
      toast.success('Book removed from carousel');
    },
    onError: (error) => {
      console.error('Error deleting carousel item:', error);
      toast.error('Failed to remove book from carousel');
    }
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; position: number }[]) => 
      CarouselAPI.reorderCarouselItems(storeId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-carousel-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-carousel', storeId] });
      toast.success('Carousel order updated');
    },
    onError: (error) => {
      console.error('Error reordering carousel items:', error);
      toast.error('Failed to update carousel order');
    }
  });

  const handleAddBook = () => {
    setEditingItem(null);
    setShowEntryModal(true);
  };

  const handleEditBook = (item: CarouselItem) => {
    setEditingItem(item);
    setShowEntryModal(true);
  };

  const handleDeleteBook = async (itemId: string) => {
    if (window.confirm('Are you sure you want to remove this book from the carousel?')) {
      deleteMutation.mutate(itemId);
    }
  };

  const handleReorderBooks = (items: { id: string; position: number }[]) => {
    reorderMutation.mutate(items);
  };

  const handleModalClose = () => {
    setShowEntryModal(false);
    setEditingItem(null);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['store-carousel-admin', storeId] });
    queryClient.invalidateQueries({ queryKey: ['store-carousel', storeId] });
    handleModalClose();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading carousel management..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            Failed to load carousel items. Please try refreshing the page.
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
          <h1 className="text-3xl font-bold text-gray-900">Carousel Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your featured books carousel (up to 6 books)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSearchInterface(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search Books
          </Button>
          
          <Button
            onClick={handleAddBook}
            className="flex items-center gap-2"
            disabled={carouselItems.length >= 6}
          >
            <Plus className="h-4 w-4" />
            Add Book
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage Books
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Manage Books Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Books ({carouselItems.length}/6)</CardTitle>
              <CardDescription>
                Drag and drop to reorder books. The carousel will display books in the order shown below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookManagementGrid
                items={carouselItems}
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
                onReorder={handleReorderBooks}
                onAdd={handleAddBook}
                isReordering={reorderMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Carousel Preview</CardTitle>
              <CardDescription>
                See how your carousel will appear on the landing page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CarouselPreview items={carouselItems} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Carousel Settings</CardTitle>
              <CardDescription>
                Configure carousel behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Carousel settings coming soon...</p>
                <p className="text-sm mt-2">Auto-slide timing, transition effects, and more</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Book Entry Modal */}
      {showEntryModal && (
        <BookEntryModal
          isOpen={showEntryModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          storeId={storeId}
          editingItem={editingItem}
        />
      )}

      {/* Book Search Interface */}
      {showSearchInterface && (
        <BookSearchInterface
          isOpen={showSearchInterface}
          onClose={() => setShowSearchInterface(false)}
          onBookSelect={(bookData) => {
            // Handle book selection from search
            setEditingItem(null);
            setShowEntryModal(true);
            setShowSearchInterface(false);
            // TODO: Pre-populate modal with book data
          }}
          storeId={storeId}
        />
      )}
    </div>
  );
};

export default CarouselManagement;
