import React, { useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import { Book } from "@/types/books";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TrendingBookCard from "@/components/books/TrendingBookCard";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface DiscussedBooksSectionProps {
  books: Book[] | undefined;
  isLoading: boolean;
  isError: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
  onJoinDiscussion: (book: Book) => void;
  onRefresh: () => void;
  onLoadMore?: () => void;
}

const DiscussedBooksSection: React.FC<DiscussedBooksSectionProps> = ({
  books,
  isLoading,
  isError,
  hasMore = false,
  isLoadingMore = false,
  totalCount = 0,
  onJoinDiscussion,
  onRefresh,
  onLoadMore
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();

    // Reset the refreshing state after animation completes
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown">
            Currently Discussed Books
          </h2>
          <MessageCircle className="ml-2 h-5 w-5 text-bookconnect-sage" />
          {totalCount > 0 && (
            <span className="ml-2 text-sm text-bookconnect-brown/70 font-serif">
              ({totalCount} book{totalCount !== 1 ? 's' : ''} active in last 12 hours)
            </span>
          )}
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className={cn(
            "group relative overflow-hidden",
            "border-2 border-bookconnect-brown/30 text-bookconnect-brown font-serif font-medium",
            "hover:border-bookconnect-brown hover:bg-bookconnect-brown/5",
            "active:bg-bookconnect-brown/10 active:scale-95",
            "transition-all duration-200 ease-in-out",
            "shadow-sm hover:shadow-md",
            isRefreshing && "border-bookconnect-terracotta text-bookconnect-terracotta"
          )}
          disabled={isRefreshing || isLoading}
        >
          <div className="flex items-center space-x-2">
            <RefreshCw className={cn(
              "h-4 w-4 transition-transform duration-300",
              isRefreshing && "animate-spin text-bookconnect-terracotta",
              !isRefreshing && "group-hover:rotate-180"
            )} />
            <span className="text-sm">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          </div>
          {/* Subtle background animation on hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-bookconnect-brown/5 to-bookconnect-terracotta/5",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            "-z-10"
          )} />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Unable to load discussed books." onRetry={onRefresh} />
      ) : !books || books.length === 0 ? (
        <EmptyState message="No recently discussed books found." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <TrendingBookCard
                key={book.id}
                book={book}
                onJoinDiscussion={() => onJoinDiscussion(book)}
                badge={
                  <Badge className="bg-bookconnect-sage text-white shadow-lg flex items-center gap-1 px-2.5 py-1">
                    <MessageCircle className="h-4 w-4" /> Active Discussion
                  </Badge>
                }
              />
            ))}
          </div>

          {/* Load More Button */}
          {(hasMore || isLoadingMore) && onLoadMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
                className="border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-brown/10 font-serif"
              >
                {isLoadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bookconnect-brown mr-2"></div>
                    Loading more books...
                  </>
                ) : (
                  <>
                    Load More Books
                    <span className="ml-2 text-sm opacity-70">
                      ({books.length} of {totalCount})
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscussedBooksSection;