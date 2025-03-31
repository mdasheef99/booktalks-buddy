
import React from "react";
import BookConnectHeader from "@/components/BookConnectHeader";
import BookSearchForm from "@/components/books/BookSearchForm";
import SearchResults from "@/components/books/SearchResults";
import TrendingBooksSection from "@/components/books/TrendingBooksSection";
import DiscussedBooksSection from "@/components/books/DiscussedBooksSection";
import { ProfileDialog } from "@/components/profile";
import ExploreHeader from "@/components/books/ExploreHeader";
import ExploreContainer from "@/components/books/ExploreContainer";
import { useExploreBooks } from "@/hooks/useExploreBooks";
import { BookType } from "@/types/books";

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
  const {
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
    handleSearch,
    handleJoinDiscussion,
    refetchDiscussedBooks
  } = useExploreBooks();

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
          onJoinDiscussion={(book: BookType) => handleJoinDiscussion(book.id, book.title, book.author)}
        />
        
        <TrendingBooksSection
          genre={primaryGenre}
          books={trendingBooks}
          isLoading={isTrendingLoading}
          isError={isTrendingError}
          fallbackBooks={FALLBACK_TRENDING_BOOKS}
          onJoinDiscussion={(book: BookType) => handleJoinDiscussion(book.id, book.title, book.author)}
        />

        <DiscussedBooksSection 
          books={discussedBooks}
          isLoading={isDiscussedLoading}
          isError={isDiscussedError}
          onJoinDiscussion={(book: BookType) => handleJoinDiscussion(book.id, book.title, book.author)}
          onRefresh={refetchDiscussedBooks}
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
