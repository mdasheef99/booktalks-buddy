/**
 * Profile Collections Section Component
 * 
 * Displays a user's public collections on their profile page
 * Fetches and displays collections with book counts and preview covers
 * Handles loading states, empty states, and responsive design
 * Follows BookConnect design system patterns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getPublicCollections } from '@/services/books/collections';
import { BookCollection, CollectionQueryOptions } from '@/services/books/collections';
import { CollectionCard } from '@/components/books/collections/CollectionCard';
import { CollectionBooksView } from '@/components/books/collections/CollectionBooksView';

interface ProfileCollectionsSectionProps {
  userId: string;
  username: string; // For display purposes
  isCurrentUser: boolean; // To show different messaging
  className?: string;
}

const ProfileCollectionsSection: React.FC<ProfileCollectionsSectionProps> = ({
  userId,
  username,
  isCurrentUser,
  className
}) => {
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [viewingCollection, setViewingCollection] = useState<BookCollection | null>(null);

  // Initial load limit
  const INITIAL_LIMIT = 12;
  const displayedCollections = showMore ? collections : collections.slice(0, INITIAL_LIMIT);
  const hasMoreCollections = collections.length > INITIAL_LIMIT;

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching public collections for user ${userId}`);

        const options: CollectionQueryOptions = {
          includeBookCount: true,
          includePreviewCovers: true,
          sortBy: 'updated_at',
          sortOrder: 'desc',
          limit: 50 // Get more than we initially display for "show more" functionality
        };

        const items = await getPublicCollections(userId, options);

        setCollections(items);
        console.log(`Loaded ${items.length} public collections`);
        
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to load collections');
        toast.error('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCollections();
    }
  }, [userId]);

  const handleShowMore = () => {
    setShowMore(true);
  };

  const handleShowLess = () => {
    setShowMore(false);
  };

  // Handle collection viewing
  const handleViewCollection = (collection: BookCollection) => {
    setViewingCollection(collection);
  };

  const handleBackToGrid = () => {
    setViewingCollection(null);
  };

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-bookconnect-terracotta" />
            Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-brown mx-auto mb-4"></div>
            <p className="text-bookconnect-brown/70">Loading collections...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-bookconnect-terracotta" />
            Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
              Unable to Load Collections
            </h3>
            <p className="text-bookconnect-brown/70">
              {error}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (collections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-bookconnect-terracotta" />
            Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {isCurrentUser ? (
              <>
                <FolderOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                  Your Collections are Private
                </h3>
                <p className="text-bookconnect-brown/70">
                  Your collections are set to private or you haven't created any collections yet.
                </p>
              </>
            ) : (
              <>
                <EyeOff className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                  No Public Collections
                </h3>
                <p className="text-bookconnect-brown/70">
                  {username} hasn't shared any collections publicly yet.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main content
  return (
    <>
      {viewingCollection ? (
        // Collection Books View
        <CollectionBooksView
          collection={viewingCollection}
          userId={userId}
          onBack={handleBackToGrid}
          // No edit/delete/add actions for profile viewing (read-only mode)
          showActions={false}
          className={className}
        />
      ) : (
        // Collections Grid View
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-bookconnect-terracotta" />
              Collections
              <span className="text-sm font-normal text-bookconnect-brown/70">
                ({collections.length} collection{collections.length !== 1 ? 's' : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  previewBooks={[]} // Preview books handled by collection data
                  showActions={false} // Read-only mode for profile viewing
                  onView={handleViewCollection} // Enable viewing collection details
                />
              ))}
            </div>

            {/* Show More/Less Controls */}
            {hasMoreCollections && (
              <div className="text-center mt-6">
                {!showMore ? (
                  <Button
                    variant="outline"
                    onClick={handleShowMore}
                    className="border-bookconnect-brown/20 text-bookconnect-brown hover:bg-bookconnect-cream/20"
                  >
                    Show More Collections ({collections.length - INITIAL_LIMIT} more)
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleShowLess}
                    className="border-bookconnect-brown/20 text-bookconnect-brown hover:bg-bookconnect-cream/20"
                  >
                    Show Less
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ProfileCollectionsSection;
