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
  onJoinDiscussion: (book: Book) => void;
  onRefresh: () => void;
}

const DiscussedBooksSection: React.FC<DiscussedBooksSectionProps> = ({
  books,
  isLoading,
  isError,
  onJoinDiscussion,
  onRefresh,
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
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="border-bookconnect-sage text-bookconnect-sage hover:bg-bookconnect-sage/10"
          disabled={isRefreshing}
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-1",
            isRefreshing && "animate-spin"
          )} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
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
      )}
    </div>
  );
};

export default DiscussedBooksSection;