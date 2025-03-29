
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { BookOpen, Loader2, Search, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchBooksByQuery, fetchTrendingBooks } from "@/services/googleBooksService";
import BookCard from "@/components/books/BookCard";
import TrendingBookCard from "@/components/books/TrendingBookCard";
import Layout from "@/components/Layout";

const FALLBACK_TRENDING_BOOKS = [
  { 
    id: "fallback-1",
    title: "The White Tiger", 
    author: "Aravind Adiga", 
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1287&auto=format&fit=crop", 
    description: "A darkly humorous perspective on India's class struggle in a globalized world" 
  },
  { 
    id: "fallback-2",
    title: "Shantaram", 
    author: "Gregory David Roberts", 
    imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1287&auto=format&fit=crop", 
    description: "An escaped convict's journey through the underworld of contemporary Bombay" 
  },
  { 
    id: "fallback-3",
    title: "The God of Small Things", 
    author: "Arundhati Roy", 
    imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1288&auto=format&fit=crop", 
    description: "A story about the childhood experiences of fraternal twins whose lives are destroyed by the 'Love Laws'" 
  }
];

const ExploreBooks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const genre = searchParams.get("genre") || localStorage.getItem("selected_genre") || "Fiction";
  const { toast } = useToast();
  const navigate = useNavigate();

  // Search query handling
  const { data: searchResults, isLoading: isSearching, refetch: searchBooks, isError: isSearchError } = useQuery({
    queryKey: ["bookSearch", searchQuery],
    queryFn: () => fetchBooksByQuery(searchQuery, 8),
    enabled: false,
  });

  // Trending books query with fixed TypeScript error
  const { data: trendingBooks, isLoading: isTrendingLoading, isError: isTrendingError } = useQuery({
    queryKey: ["trendingBooks", genre],
    queryFn: () => fetchTrendingBooks(genre, 5),
    // Using meta.onError instead of direct onError prop
    meta: {
      onError: (error: Error) => {
        Sentry.captureException(error);
        toast({
          title: "Couldn't load trending books",
          description: "We're having trouble finding the hottest reads right now.",
          variant: "destructive",
        });
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      searchBooks();
    }
  };

  const handleJoinDiscussion = (bookId: string, bookTitle: string) => {
    navigate(`/books/${bookId}?title=${encodeURIComponent(bookTitle)}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-bookconnect-cream">
        <div 
          className="relative py-12 px-6 md:px-8 lg:px-12 max-w-7xl mx-auto"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=1470&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            backgroundBlendMode: "overlay",
            backgroundColor: "rgba(248, 243, 230, 0.92)",
          }}
        >
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-bookconnect-brown text-center">
              Explore Books
            </h1>
            <p className="text-center text-bookconnect-brown/70 mt-2 font-serif max-w-2xl mx-auto">
              {genre ? `Discover amazing reads in ${genre}` : "Find your next favorite book"}
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-12">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex items-center p-3 bg-white border-2 border-bookconnect-brown/40 rounded-lg shadow-md" 
                   style={{
                     backgroundImage: "url('https://images.unsplash.com/photo-1519677584237-752f8853252e?q=80&w=1470&auto=format&fit=crop')",
                     backgroundSize: "cover",
                     backgroundPosition: "center",
                     backgroundBlendMode: "overlay",
                     backgroundColor: "rgba(255, 255, 255, 0.9)",
                   }}>
                <Input
                  type="text"
                  placeholder="Search by title, author, or keyword..."
                  className="flex-grow border-none bg-transparent focus-visible:ring-0 text-bookconnect-brown placeholder:text-bookconnect-brown/50 font-serif"
                  style={{ fontFamily: "Georgia, serif" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit" 
                  className="ml-2 bg-bookconnect-brown hover:bg-bookconnect-brown/80"
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  <span className="ml-1">Search</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Search Results */}
          {searchQuery && searchResults && (
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown mb-4">
                Search Results
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
                      onJoinDiscussion={() => handleJoinDiscussion(book.id, book.title)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trending Section */}
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown">
                Trending in {genre}
              </h2>
              <TrendingUp className="ml-2 h-5 w-5 text-bookconnect-terracotta" />
            </div>
            
            {isTrendingLoading ? (
              <div className="flex justify-center items-center h-60">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-bookconnect-brown" />
                  <span className="absolute -bottom-8 text-bookconnect-brown font-serif whitespace-nowrap">
                    Finding trending books...
                  </span>
                </div>
              </div>
            ) : isTrendingError || !trendingBooks || trendingBooks.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {FALLBACK_TRENDING_BOOKS.map(book => (
                  <TrendingBookCard
                    key={book.id}
                    book={book}
                    onJoinDiscussion={() => handleJoinDiscussion(book.id, book.title)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingBooks.map(book => (
                  <TrendingBookCard
                    key={book.id}
                    book={book}
                    onJoinDiscussion={() => handleJoinDiscussion(book.id, book.title)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExploreBooks;
