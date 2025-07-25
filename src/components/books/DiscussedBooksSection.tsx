
import React from "react";
import { BookType } from "@/types/books";
import { Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TrendingBookCard from "./TrendingBookCard";

interface DiscussedBooksSectionProps {
  books: BookType[] | undefined;
  isLoading: boolean;
  isError: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
  onJoinDiscussion: (book: BookType) => void;
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
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 my-12">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-bookconnect-brown" />
          <span className="absolute -bottom-8 text-bookconnect-brown font-serif whitespace-nowrap">
            Loading discussed books...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown">
            Currently Discussed Books
          </h2>
          <MessageCircle className="ml-2 h-5 w-5 text-bookconnect-sage" />
        </div>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          size="sm"
          className="border-bookconnect-sage text-bookconnect-sage hover:bg-bookconnect-sage/10"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {isError || !books || books.length === 0 ? (
        <div className="bg-white/30 border border-bookconnect-brown/10 p-6 rounded-lg text-center">
          <p className="text-bookconnect-brown/70 font-serif italic">No recently discussed books found.</p>
        </div>
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
