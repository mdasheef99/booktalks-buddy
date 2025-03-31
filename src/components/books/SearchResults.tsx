
import React from "react";
import { BookType } from "@/types/books";
import BookCard from "@/components/books/BookCard";

interface SearchResultsProps {
  searchQuery: string;
  searchResults: BookType[] | undefined;
  isSearchError: boolean;
  onJoinDiscussion: (book: BookType) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  searchQuery, 
  searchResults, 
  isSearchError,
  onJoinDiscussion 
}) => {
  if (!searchQuery || !searchResults) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown mb-4">
        Search Results for "{searchQuery}"
      </h2>
      {isSearchError ? (
        <div className="text-center p-6 bg-white/80 border border-bookconnect-brown/20 rounded-lg shadow">
          <p className="text-bookconnect-terracotta font-serif">
            We couldn't find what you're looking for. Try a different search?
          </p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center p-6 bg-white/80 border border-bookconnect-brown/20 rounded-lg shadow">
          <p className="text-bookconnect-brown/70 font-serif">
            No books found for "{searchQuery}". Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults.map(book => (
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
