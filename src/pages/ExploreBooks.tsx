import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as Sentry from "@sentry/react";

import BookConnectHeader from "@/components/BookConnectHeader";
import BookSearchForm from "@/components/books/BookSearchForm";
import { SimpleProfileDialog } from "@/components/anonymous-chat/SimpleProfileDialog";

// New components
import NewSearchResults from "@/components/explore/SearchResults";
import NewTrendingBooksSection from "@/components/explore/TrendingBooksSection";
import NewDiscussedBooksSection from "@/components/explore/DiscussedBooksSection";
import NewExploreHeader from "@/components/explore/ExploreHeader";
import NewExploreContainer from "@/components/explore/ExploreContainer";

import { useToast } from "@/hooks/use-toast";
import { useSearchBooks } from "@/hooks/explore/useSearchBooks";
import { useTrendingBooks } from "@/hooks/explore/useTrendingBooks";
import { usePaginatedDiscussedBooks } from "@/hooks/explore/usePaginatedDiscussedBooks";
import { generateLiteraryUsername } from "@/utils/usernameGenerator";
import { Book } from "@/types/books";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const genreParam = searchParams.get("genre") || "";
  const genres = genreParam.split(",").filter(Boolean);
  const primaryGenre = genres[0] || localStorage.getItem("selected_genre") || "Fiction";

  const [lastDiscussionTime, setLastDiscussionTime] = useState<number>(Date.now());

  useEffect(() => {
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
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleJoinDiscussion = useCallback(
    (bookId: string, bookTitle: string, bookAuthor: string = "", bookCoverUrl: string = "") => {
      try {
        navigate(
          `/book-discussion/${bookId}?title=${encodeURIComponent(bookTitle)}&author=${encodeURIComponent(
            bookAuthor
          )}&coverUrl=${encodeURIComponent(bookCoverUrl || "")}`
        );
        setLastDiscussionTime(Date.now());
      } catch (error) {
        console.error("Navigation failed:", error);
        toast({
          title: "Couldn't open discussion",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    },
    [navigate, toast]
  );

  const {
    data: searchResults,
    isLoading: isSearching,
    isError: isSearchError,
  } = useSearchBooks(searchQuery);

  const {
    data: trendingBooks,
    isLoading: isTrendingLoading,
    isError: isTrendingError,
  } = useTrendingBooks(primaryGenre);

  const discussedBooksState = usePaginatedDiscussedBooks(6, 12); // 6 books per page, 12 hours filter

  const isNewExploreEnabled = import.meta.env.VITE_NEW_EXPLORE_ENABLED === 'true';

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <BookConnectHeader
        externalProfileDialog={{
          isOpen: showProfileDialog,
          setOpen: setShowProfileDialog,
        }}
      />
      {/* Render the SimpleProfileDialog component for anonymous chat */}
      <SimpleProfileDialog
        open={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      />
        <NewExploreContainer>
          <NewExploreHeader genres={genres} primaryGenre={primaryGenre} />

          <div className="mb-12">
            <BookSearchForm onSearch={handleSearch} isSearching={isSearching} />
          </div>

          <main id="main-content">
            <NewSearchResults
            searchQuery={searchQuery}
            searchResults={searchResults || []}
            isSearchError={isSearchError}
            isLoading={isSearching}
            isError={isSearchError}
            onJoinDiscussion={(book: Book) =>
              handleJoinDiscussion(book.id, book.title, book.author, book.imageUrl || "")
            }
          />

          <NewTrendingBooksSection
            genre={primaryGenre}
            books={trendingBooks || []}
            isLoading={isTrendingLoading}
            isError={isTrendingError}
            fallbackBooks={FALLBACK_TRENDING_BOOKS}
            onJoinDiscussion={(book: Book) =>
              handleJoinDiscussion(book.id, book.title, book.author, book.imageUrl || "")
            }
          />

          <NewDiscussedBooksSection
            books={discussedBooksState.books}
            isLoading={discussedBooksState.isLoading}
            isError={discussedBooksState.isError}
            hasMore={discussedBooksState.hasMore}
            isLoadingMore={discussedBooksState.isLoadingMore}
            totalCount={discussedBooksState.totalCount}
            onJoinDiscussion={(book: Book) =>
              handleJoinDiscussion(book.id, book.title, book.author, book.imageUrl || "")
            }
            onRefresh={() => {
              setLastDiscussionTime(Date.now());
              discussedBooksState.refresh();
            }}
            onLoadMore={discussedBooksState.loadMore}
          />
          </main>
        </NewExploreContainer>
    </div>
  );
};

export default ExploreBooks;
