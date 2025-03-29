
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";

import { useToast } from "@/hooks/use-toast";
import { fetchBooksByQuery, fetchTrendingBooks } from "@/services/googleBooksService";
import Layout from "@/components/Layout";
import BookSearchForm from "@/components/books/BookSearchForm";
import SearchResults from "@/components/books/SearchResults";
import TrendingBooksSection from "@/components/books/TrendingBooksSection";

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

  // Trending books query
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchBooks();
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
            <BookSearchForm onSearch={handleSearch} isSearching={isSearching} />
          </div>

          {/* Search Results */}
          <SearchResults 
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearchError={isSearchError}
            onJoinDiscussion={handleJoinDiscussion}
          />

          {/* Trending Section */}
          <TrendingBooksSection
            genre={genre}
            books={trendingBooks}
            isLoading={isTrendingLoading}
            isError={isTrendingError}
            fallbackBooks={FALLBACK_TRENDING_BOOKS}
            onJoinDiscussion={handleJoinDiscussion}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ExploreBooks;
