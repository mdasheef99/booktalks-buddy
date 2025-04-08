import React from "react";
import { TrendingUp } from "lucide-react";
import { Book } from "@/types/books";
import TrendingBookCard from "@/components/books/TrendingBookCard";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

interface TrendingBooksSectionProps {
  genre: string;
  books: Book[] | undefined;
  isLoading: boolean;
  isError: boolean;
  fallbackBooks?: Book[];
  onJoinDiscussion: (book: Book) => void;
}

const TrendingBooksSection: React.FC<TrendingBooksSectionProps> = ({
  genre,
  books,
  isLoading,
  isError,
  fallbackBooks,
  onJoinDiscussion,
}) => {
  const displayBooks = !isLoading && !isError && books && books.length > 0 ? books : fallbackBooks;

  return (
    <div>
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown">
          Trending in {genre}
        </h2>
        <TrendingUp className="ml-2 h-5 w-5 text-bookconnect-terracotta" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Unable to load trending books. Showing fallback recommendations." />
      ) : !displayBooks || displayBooks.length === 0 ? (
        <EmptyState message="No trending books found." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBooks.map((book) => (
            <TrendingBookCard
              key={book.id}
              book={book}
              onJoinDiscussion={() => onJoinDiscussion(book)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingBooksSection;