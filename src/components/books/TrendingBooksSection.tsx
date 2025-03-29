
import React from "react";
import { BookType } from "@/types/books";
import { Loader2, TrendingUp } from "lucide-react";
import TrendingBookCard from "@/components/books/TrendingBookCard";

interface TrendingBooksSectionProps {
  genre: string;
  books: BookType[] | undefined;
  isLoading: boolean;
  isError: boolean;
  fallbackBooks: BookType[];
  onJoinDiscussion: (bookId: string, bookTitle: string, bookAuthor?: string) => void;
}

const TrendingBooksSection: React.FC<TrendingBooksSectionProps> = ({ 
  genre, 
  books, 
  isLoading, 
  isError,
  fallbackBooks,
  onJoinDiscussion 
}) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown">
          Trending in {genre}
        </h2>
        <TrendingUp className="ml-2 h-5 w-5 text-bookconnect-terracotta" />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-bookconnect-brown" />
            <span className="absolute -bottom-8 text-bookconnect-brown font-serif whitespace-nowrap">
              Finding trending books...
            </span>
          </div>
        </div>
      ) : isError || !books || books.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fallbackBooks.map(book => (
            <TrendingBookCard
              key={book.id}
              book={book}
              onJoinDiscussion={() => onJoinDiscussion(book.id, book.title, book.author)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map(book => (
            <TrendingBookCard
              key={book.id}
              book={book}
              onJoinDiscussion={() => onJoinDiscussion(book.id, book.title, book.author)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingBooksSection;
