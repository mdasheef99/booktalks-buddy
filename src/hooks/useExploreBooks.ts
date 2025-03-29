
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";

import { useToast } from "@/hooks/use-toast";
import { fetchBooksByQuery, fetchTrendingBooks } from "@/services/googleBooksService";
import { fetchRecentlyDiscussedBooks } from "@/services/discussedBooksService";
import { generateLiteraryUsername } from "@/utils/usernameGenerator";
import { BookType } from "@/types/books";

export function useExploreBooks() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [selectedBookTitle, setSelectedBookTitle] = useState<string>("");
  const [showDiscussion, setShowDiscussion] = useState(false);
  
  const genreParam = searchParams.get("genre") || "";
  const genres = genreParam.split(',').filter(Boolean);
  const primaryGenre = genres[0] || localStorage.getItem("selected_genre") || "Fiction";
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize user profile
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

  // Book search query
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

  // Recently discussed books query
  const {
    data: discussedBooks,
    isLoading: isDiscussedLoading,
    isError: isDiscussedError,
    refetch: refetchDiscussedBooks
  } = useQuery({
    queryKey: ["discussedBooks"],
    queryFn: () => fetchRecentlyDiscussedBooks(4),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    meta: {
      onError: (error: Error) => {
        Sentry.captureException(error, {
          tags: {
            component: "ExploreBooks",
            action: "fetchDiscussedBooks"
          }
        });
        
        toast({
          title: "Couldn't load discussed books",
          description: "We're having trouble loading books currently being discussed.",
          variant: "destructive",
        });
      }
    }
  });

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      console.log("Performing search for:", query);
      searchBooks();
    }
  };

  // Join discussion handler
  const handleJoinDiscussion = (bookId: string, bookTitle: string, bookAuthor: string = "") => {
    if (window.innerWidth < 768) {
      navigate(`/books/${bookId}/discussion?title=${encodeURIComponent(bookTitle)}&author=${encodeURIComponent(bookAuthor)}`);
    } else {
      setShowDiscussion(true);
      setSelectedBookId(bookId);
      setSelectedBookTitle(bookTitle);
      
      setTimeout(() => {
        refetchDiscussedBooks();
      }, 1000);
    }
  };

  // Auto refresh discussed books
  useEffect(() => {
    refetchDiscussedBooks();
  }, [refetchDiscussedBooks]);

  return {
    searchQuery,
    genres,
    primaryGenre,
    searchResults,
    isSearching,
    isSearchError,
    trendingBooks,
    isTrendingLoading,
    isTrendingError,
    discussedBooks,
    isDiscussedLoading,
    isDiscussedError,
    showProfileDialog,
    setShowProfileDialog,
    selectedBookId,
    selectedBookTitle,
    showDiscussion,
    handleSearch,
    handleJoinDiscussion,
    refetchDiscussedBooks
  };
}
