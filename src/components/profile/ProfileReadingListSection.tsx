/**
 * Profile Reading List Section Component
 * 
 * Displays a user's public reading list on their profile page
 * Fetches and displays books with ratings and reviews
 * Handles loading states, empty states, and responsive design
 * Follows BookConnect design system patterns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getPublicReadingList } from '@/lib/api/books/reading-lists';
import { ReadingListItem, ReadingListQueryOptions } from '@/services/books';
import ProfileBookCard from './ProfileBookCard';
import { ProfileReadingListSearch } from './ProfileReadingListSearch';

interface ProfileReadingListSectionProps {
  userId: string;
  username: string; // For display purposes
  isCurrentUser: boolean; // To show different messaging
  className?: string;
}

const ProfileReadingListSection: React.FC<ProfileReadingListSectionProps> = ({
  userId,
  username,
  isCurrentUser,
  className
}) => {
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [filteredReadingList, setFilteredReadingList] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  // Initial load limit
  const INITIAL_LIMIT = 12;
  const displayedBooks = showMore ? filteredReadingList : filteredReadingList.slice(0, INITIAL_LIMIT);
  const hasMoreBooks = filteredReadingList.length > INITIAL_LIMIT;

  // Handle filtered items change from search component
  const handleFilteredItemsChange = useCallback((filteredItems: ReadingListItem[]) => {
    setFilteredReadingList(filteredItems);
    setShowMore(false); // Reset show more when filters change
  }, []);

  useEffect(() => {
    const fetchReadingList = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching public reading list for user ${userId}`);

        const options: ReadingListQueryOptions = {
          sortBy: 'status_changed_at',
          sortOrder: 'desc',
          limit: 50 // Get more than we initially display for "show more" functionality
        };

        const items = await getPublicReadingList(userId, options);

        // No need to filter - the database query now uses !inner join to ensure all items have book data
        setReadingList(items);
        setFilteredReadingList(items); // Initialize filtered list
        console.log(`Loaded ${items.length} public reading list items`);
        
      } catch (err) {
        console.error('Error fetching reading list:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reading list');
        toast.error('Failed to load reading list');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReadingList();
    }
  }, [userId]);

  const handleShowMore = () => {
    setShowMore(true);
  };

  const handleShowLess = () => {
    setShowMore(false);
  };

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-bookconnect-terracotta" />
            Reading List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-brown mx-auto mb-4"></div>
            <p className="text-bookconnect-brown/70">Loading reading list...</p>
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
            <BookOpen className="h-5 w-5 text-bookconnect-terracotta" />
            Reading List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
              Unable to Load Reading List
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
  if (readingList.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-bookconnect-terracotta" />
            Reading List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {isCurrentUser ? (
              <>
                <BookOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                  Your Reading List is Private
                </h3>
                <p className="text-bookconnect-brown/70">
                  Your books are set to private or you haven't added any books yet.
                </p>
              </>
            ) : (
              <>
                <EyeOff className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                  No Public Books
                </h3>
                <p className="text-bookconnect-brown/70">
                  {username} hasn't shared any books publicly yet.
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-bookconnect-terracotta" />
          Reading List
          <span className="text-sm font-normal text-bookconnect-brown/70">
            ({readingList.length} book{readingList.length !== 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
          <ProfileReadingListSearch
            readingList={readingList}
            username={username}
            isCurrentUser={isCurrentUser}
            onFilteredItemsChange={handleFilteredItemsChange}
            className="mb-6"
          />

          {/* No Results State */}
          {filteredReadingList.length === 0 && readingList.length > 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                No Books Found
              </h3>
              <p className="text-bookconnect-brown/70">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}

          {/* Books Grid */}
          {filteredReadingList.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedBooks.map((item) => (
                  <ProfileBookCard
                    key={item.id}
                    book={item.personal_books!}
                    readingListItem={item}
                    showReview={true}
                    reviewerName={username}
                  />
                ))}
              </div>

              {/* Show More/Less Controls */}
              {hasMoreBooks && (
                <div className="text-center mt-6">
                  {!showMore ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowMore(true)}
                      className="border-bookconnect-brown/20 text-bookconnect-brown hover:bg-bookconnect-cream/20"
                    >
                      Show More Books ({filteredReadingList.length - INITIAL_LIMIT} more)
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowMore(false)}
                      className="border-bookconnect-brown/20 text-bookconnect-brown hover:bg-bookconnect-cream/20"
                    >
                      Show Less
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
      </CardContent>
    </Card>
  );
};

export default ProfileReadingListSection;
