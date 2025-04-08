import React from "react";
import { Book } from "@/types/books";
import BookCard from "@/components/books/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

interface SearchResultsProps {
  searchQuery: string;
  searchResults: Book[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isSearchError: boolean;
  onJoinDiscussion: (book: Book) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchQuery,
  searchResults,
  isLoading,
  isError,
  onJoinDiscussion,
}) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown mb-4">
        Search Results for "{searchQuery}"
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="We couldn't find what you're looking for. Try a different search?" />
      ) : !searchResults || searchResults.length === 0 ? (
        <EmptyState message={`No books found for "${searchQuery}". Try a different search term.`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults.map((book) => (
            <BookCard
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

export default SearchResults;