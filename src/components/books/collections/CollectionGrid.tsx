/**
 * Collection Grid Component
 * 
 * Grid layout for displaying multiple collections with responsive design
 * Includes loading states and create collection functionality
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollectionCard } from './CollectionCard';
import { CollectionGridProps } from './types';

export const CollectionGrid: React.FC<CollectionGridProps> = ({
  collections,
  loading = false,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  onViewCollection,
  showCreateButton = true,
  className
}) => {
  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="h-6 bg-bookconnect-cream rounded mb-2"></div>
        <div className="h-4 bg-bookconnect-cream/70 rounded mb-3 w-3/4"></div>
        <div className="flex -space-x-2 mb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-12 h-16 bg-bookconnect-cream rounded"></div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-bookconnect-cream rounded w-20"></div>
          <div className="h-6 bg-bookconnect-cream rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <FolderOpen className="h-16 w-16 text-bookconnect-brown/30 mb-4" />
      <h3 className="font-serif text-xl font-semibold text-bookconnect-brown mb-2">
        No Collections Yet
      </h3>
      <p className="text-bookconnect-brown/70 mb-6 max-w-md">
        Create your first collection to organize your books into custom groups and themes.
      </p>
      {showCreateButton && onCreateCollection && (
        <Button
          onClick={onCreateCollection}
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Collection
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Create Collection Button */}
      {showCreateButton && onCreateCollection && collections.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-bookconnect-brown">
              My Collections
            </h2>
            <p className="text-bookconnect-brown/70 mt-1">
              Organize your books into custom collections
            </p>
          </div>
          <Button
            onClick={onCreateCollection}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeletons
          [...Array(8)].map((_, index) => (
            <LoadingSkeleton key={index} />
          ))
        ) : collections.length === 0 ? (
          // Empty state
          <EmptyState />
        ) : (
          // Collection cards
          collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              previewBooks={collection.preview_covers ? [] : []} // TODO: Add preview books data
              onEdit={onEditCollection}
              onDelete={onDeleteCollection}
              onView={onViewCollection}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
};
