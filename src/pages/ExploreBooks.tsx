
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";

import { useToast } from "@/hooks/use-toast";
import { fetchBooksByQuery, fetchTrendingBooks } from "@/services/googleBooksService";
import BookSearchForm from "@/components/books/BookSearchForm";
import SearchResults from "@/components/books/SearchResults";
import TrendingBooksSection from "@/components/books/TrendingBooksSection";
import BookConnectHeader from "@/components/BookConnectHeader";
import { ProfileDialog } from "@/components/profile";
import { generateLiteraryUsername } from "@/utils/usernameGenerator";
import ExploreHeader from "@/components/books/ExploreHeader";
import ExploreContainer from "@/components/books/ExploreContainer";

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
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const genreParam = searchParams.get("genre") || "";
  const genres = genreParam.split(',').filter(Boolean);
  const primaryGenre = genres[0] || localStorage.getItem("selected_genre") || "Fiction";
  
  useEffect(() => {
    if (!genreParam) {
      try {
        const savedGenres = localStorage.getItem("selected_genres");
        if (savedGenres) {
          const parsedGenres = JSON.parse(savedGenres);
          if (Array.isArray(parsedGenres) && parsedGenres.length > 0) {
            console.log("Loaded genres from localStorage:", parsedGenres);
          }
        }
      } catch (error) {
        console.error("Error loading genres from localStorage:", error);
      }
    }
    
    const hasVisitedBefore = localStorage.getItem("has_visited_explore");
    if (!hasVisitedBefore) {
      if (!localStorage.getItem("username")) {
        const generatedUsername = generateLiteraryUsername();
        localStorage.setItem("username", generatedUsername);
      }
      
      setTimeout(() => {
        setShowProfileDialog(true);
      }, 500);
      
      localStorage.setItem("has_visited_explore", "true");
    }
  }, [genreParam]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const { 
    data: trendingBooks, 
    isLoading: isTrendingLoading, 
    isError: isTrendingError 
  } = useQuery({
    queryKey: ["trendingBooks", primaryGenre],
    queryFn: () => fetchTrendingBooks(primaryGenre, 5),
    meta: {
      onError: (error: Error) => {
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

  const handleJoinDiscussion = (bookId: string, bookTitle: string, bookAuthor?: string) => {
    navigate(`/books/${bookId}/discussion?title=${encodeURIComponent(bookTitle)}&author=${encodeURIComponent(bookAuthor || "")}`);
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <BookConnectHeader />
      
      <ExploreContainer>
        <ExploreHeader genres={genres} primaryGenre={primaryGenre} />

        <div className="mb-12">
          <BookSearchForm onSearch={handleSearch} isSearching={isSearching} />
        </div>

        <SearchResults 
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearchError={isSearchError}
          onJoinDiscussion={(bookId, bookTitle, bookAuthor) => handleJoinDiscussion(bookId, bookTitle, bookAuthor)}
        />

        <TrendingBooksSection
          genre={primaryGenre}
          books={trendingBooks}
          isLoading={isTrendingLoading}
          isError={isTrendingError}
          fallbackBooks={FALLBACK_TRENDING_BOOKS}
          onJoinDiscussion={(bookId, bookTitle, bookAuthor) => handleJoinDiscussion(bookId, bookTitle, bookAuthor)}
        />
      </ExploreContainer>
      
      <ProfileDialog 
        open={showProfileDialog} 
        onClose={() => setShowProfileDialog(false)} 
      />
    </div>
  );
};

export default ExploreBooks;
