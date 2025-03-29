
import React, { useState, useEffect } from "react";
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
  
  // Handle multiple genres from URL or localStorage
  const genreParam = searchParams.get("genre") || "";
  const genres = genreParam.split(',').filter(Boolean);
  const primaryGenre = genres[0] || localStorage.getItem("selected_genre") || "Fiction";
  
  // Load all selected genres from localStorage if not in URL
  useEffect(() => {
    if (!genreParam) {
      try {
        const savedGenres = localStorage.getItem("selected_genres");
        if (savedGenres) {
          const parsedGenres = JSON.parse(savedGenres);
          if (Array.isArray(parsedGenres) && parsedGenres.length > 0) {
            // We don't update the URL here to avoid navigation loops
            console.log("Loaded genres from localStorage:", parsedGenres);
          }
        }
      } catch (error) {
        console.error("Error loading genres from localStorage:", error);
      }
    }
  }, [genreParam]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Search query handling with enabled set to true when searchQuery has content
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    refetch: searchBooks, 
    isError: isSearchError 
  } = useQuery({
    queryKey: ["bookSearch", searchQuery],
    queryFn: () => fetchBooksByQuery(searchQuery, 8),
    enabled: searchQuery.length > 0,
    meta: {
      onError: (error: Error) => {
        // Log error to Sentry
        Sentry.captureException(error, {
          tags: { 
            component: "ExploreBooks",
            action: "searchBooks" 
          },
          extra: { searchQuery }
        });
        
        toast({
          title: "Search Error",
          description: "We couldn't find what you're looking for. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Trending books query
  const { 
    data: trendingBooks, 
    isLoading: isTrendingLoading, 
    isError: isTrendingError 
  } = useQuery({
    queryKey: ["trendingBooks", primaryGenre],
    queryFn: () => fetchTrendingBooks(primaryGenre, 5),
    meta: {
      onError: (error: Error) => {
        // Log error to Sentry 
        Sentry.captureException(error, {
          tags: { 
            component: "ExploreBooks", 
            action: "fetchTrendingBooks" 
          },
          extra: { genre: primaryGenre, allGenres: genres }
        });
        
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
    if (query.trim()) {
      console.log("Performing search for:", query);
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
              {genres.length > 1 
                ? `Discover amazing reads in ${genres.slice(0, 3).join(', ')}${genres.length > 3 ? '...' : ''}`
                : primaryGenre 
                  ? `Discover amazing reads in ${primaryGenre}` 
                  : "Find your next favorite book"}
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
            genre={primaryGenre}
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
