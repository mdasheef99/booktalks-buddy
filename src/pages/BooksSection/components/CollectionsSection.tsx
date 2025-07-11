/**
 * Collections Section Component
 *
 * Full-featured collections interface and management for Books Section
 */

import React, { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PersonalBook } from '@/services/books';
import { BookCollection } from '@/services/books/collections';
import { useCollections } from '@/hooks/collections/useCollections';
import { CollectionGrid } from '@/components/books/collections/CollectionGrid';
import { CreateCollectionModal } from '@/components/books/collections/CreateCollectionModal';
import { EditCollectionModal } from '@/components/books/collections/EditCollectionModal';
import { CollectionBooksView } from '@/components/books/collections/CollectionBooksView';

interface CollectionsSectionProps {
  userId: string;
  personalBooks: PersonalBook[];
  onCreateCollection?: () => void;
  onEditCollection?: (collection: BookCollection) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onViewCollection?: (collection: BookCollection) => void;
  refreshTrigger?: number; // Add refresh trigger prop
  className?: string;
}

export const CollectionsSection: React.FC<CollectionsSectionProps> = ({
  userId,
  personalBooks,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  onViewCollection,
  refreshTrigger,
  className
}) => {
  // Collections hook for data management
  const {
    collections,
    loading,
    error,
    refreshCollections,
    createCollection,
    updateCollection,
    deleteCollection
  } = useCollections(userId, {
    enabled: Boolean(userId),
    refetchOnWindowFocus: true
  });

  // Don't render if no user ID
  if (!userId) {
    return (
      <TabsContent value="collections" className="space-y-6">
        <Card className={className}>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
              Please Sign In
            </h3>
            <p className="text-bookconnect-brown/70">
              Sign in to view and manage your collections.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<BookCollection | null>(null);
  const [viewingCollection, setViewingCollection] = useState<BookCollection | null>(null);

  // Refresh collections when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refreshCollections();
    }
  }, [refreshTrigger, refreshCollections]);

  // Handle collection creation
  const handleCreateCollection = () => {
    setCreateModalOpen(true);
    onCreateCollection?.();
  };

  const handleCreateSuccess = async (newCollection: BookCollection) => {
    setCreateModalOpen(false);
    await refreshCollections();
    toast.success('Collection created successfully!');
  };

  // Handle collection editing
  const handleEditCollection = (collection: BookCollection) => {
    setSelectedCollection(collection);
    setEditModalOpen(true);
    onEditCollection?.(collection);
  };

  const handleEditSuccess = async (updatedCollection: BookCollection) => {
    setEditModalOpen(false);
    setSelectedCollection(null);
    await refreshCollections();
    toast.success('Collection updated successfully!');
  };

  // Handle collection deletion
  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await deleteCollection(collectionId);
      await refreshCollections();
      onDeleteCollection?.(collectionId);
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  // Handle collection viewing
  const handleViewCollection = (collection: BookCollection) => {
    setViewingCollection(collection);
    onViewCollection?.(collection);
  };

  const handleBackToGrid = () => {
    setViewingCollection(null);
  };

  // Error state
  if (error) {
    return (
      <TabsContent value="collections" className="space-y-6">
        <Card className={className}>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
              Error Loading Collections
            </h3>
            <p className="text-bookconnect-brown/70 mb-4">
              {error}
            </p>
            <Button
              onClick={refreshCollections}
              variant="outline"
              className="border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-brown hover:text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="collections" className="space-y-6">
      {viewingCollection ? (
        // Collection Books View
        <CollectionBooksView
          collection={viewingCollection}
          userId={userId}
          onBack={handleBackToGrid}
          onEditCollection={() => handleEditCollection(viewingCollection)}
          onDeleteCollection={() => handleDeleteCollection(viewingCollection.id)}
          onBookCountChanged={refreshCollections}
        />
      ) : (
        // Collections Grid View
        <Card className={className}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl text-bookconnect-brown">
                  My Collections
                </CardTitle>
                <p className="text-bookconnect-brown/70 mt-1">
                  Organize your books into custom collections
                </p>
              </div>
              <Button
                onClick={handleCreateCollection}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-bookconnect-brown" />
                <span className="ml-2 text-bookconnect-brown">Loading collections...</span>
              </div>
            ) : (
              <CollectionGrid
                collections={collections}
                loading={loading}
                onCreateCollection={handleCreateCollection}
                onEditCollection={handleEditCollection}
                onDeleteCollection={handleDeleteCollection}
                onViewCollection={handleViewCollection}
                showCreateButton={false} // We have our own create button in header
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        userId={userId}
      />

      {/* Edit Collection Modal */}
      <EditCollectionModal
        isOpen={editModalOpen}
        collection={selectedCollection}
        userId={userId}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCollection(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </TabsContent>
  );
};
