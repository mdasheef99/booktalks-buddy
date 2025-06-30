
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { UsernameDialog } from "@/components/dialogs/UsernameDialog";
import { GenreDialog } from "@/components/dialogs/GenreDialog";
import { LoginDialog } from "@/components/dialogs/LoginDialog";

// Import the new component sections
import LandingHeader from "@/components/landing/header/LandingHeader";
import CarouselSection from "@/components/landing/CarouselSection";
import HeroSection from "@/components/landing/HeroSection";
import PromotionalBannersSection from "@/components/landing/PromotionalBannersSection";
import EventsSection from "@/components/landing/events";
import BookClubsSection from "@/components/landing/BookClubsSection";
import BookListingSection from "@/components/landing/BookListingSection";
import BookAvailabilityRequestSection from "@/components/landing/BookAvailabilityRequestSection";
import QuoteSection from "@/components/landing/QuoteSection";
import { CommunityShowcaseSection } from "@/components/landing/CommunityShowcaseSection";
import FooterSection from "@/components/landing/FooterSection";
import { useStoreId } from "@/hooks/useStoreId";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { storeId, loading: storeIdLoading, error: storeIdError } = useStoreId();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");

  const handleUsernameComplete = (username: string) => {
    setCurrentUsername(username);
    setUsernameDialogOpen(false);
    setGenreDialogOpen(true);
  };

  const handleOpenUsernameDialog = () => {
    setUsernameDialogOpen(true);
  };
  const handleBookClubClick = async () => {
    if (user) {
      navigate("/book-club");
    } else {
      setLoginDialogOpen(true);
    }
  };

  const handleBookClubsClick = () => {
    if (user) {
      navigate("/book-clubs");
    } else {
      navigate("/login", { state: { redirectTo: "/book-clubs" } });
    }
  };

  const handleEventsClick = () => {
    navigate("/events");
  };

  const handleOffersClick = () => {
    navigate("/offers");
  };

  // Show loading state while storeId is being fetched
  if (storeIdLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bookconnect-terracotta mx-auto mb-4"></div>
          <h2 className="text-xl font-serif text-bookconnect-brown mb-2">Loading BookTalks Buddy</h2>
          <p className="text-bookconnect-brown/70">Preparing your reading experience...</p>
        </div>
      </div>
    );
  }

  // Show error state if storeId failed to load
  if (storeIdError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-bookconnect-brown mb-2">Unable to Load Store</h2>
          <p className="text-bookconnect-brown/70 mb-4">{storeIdError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bookconnect-terracotta text-white rounded-lg hover:bg-bookconnect-terracotta/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>BookConnect - Connect Through Books</title>
        <meta
          name="description"
          content="Connect anonymously through books, discover conversations, and explore bookstores with BookConnect."
        />
        <meta property="og:title" content="BookConnect - Connect Through Books" />
        <meta
          property="og:description"
          content="Connect anonymously through books, discover conversations, and explore bookstores with BookConnect."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
        />
      </Helmet>

      {/* Landing Page Header */}
      <LandingHeader
        onAnonymousChatClick={handleOpenUsernameDialog}
        onBookClubsClick={handleBookClubsClick}
        onEventsClick={handleEventsClick}
        onOffersClick={handleOffersClick}
      />

      {/* Carousel Section - Featured Books */}
      <CarouselSection storeId={storeId} />

      {/* Hero Section */}
      <HeroSection handleStartChatting={handleOpenUsernameDialog} storeId={storeId} />

      {/* Promotional Banners Section */}
      <PromotionalBannersSection storeId={storeId} />

      {/* Events Section */}
      <EventsSection handleEventsClick={handleEventsClick} />

      {/* Book Clubs Section */}
      <BookClubsSection
        handleBookClubClick={handleBookClubClick}
        handleBookClubsClick={handleBookClubsClick}
      />

      {/* Book Listing Section */}
      <BookListingSection storeId={storeId} />

      {/* Book Availability Request Section */}
      <BookAvailabilityRequestSection storeId={storeId} />

      {/* Community Showcase Section */}
      <CommunityShowcaseSection storeId={storeId} />

      {/* Quote Section */}
      <QuoteSection storeId={storeId} />

      {/* Footer Section */}
      <FooterSection
        handleEventsClick={handleEventsClick}
        handleBookClubsClick={handleBookClubsClick}
      />

      {/* Dialogs */}
      <UsernameDialog
        open={usernameDialogOpen}
        onOpenChange={setUsernameDialogOpen}
        onComplete={handleUsernameComplete}
      />

      <GenreDialog
        open={genreDialogOpen}
        onOpenChange={setGenreDialogOpen}
        username={currentUsername}
      />

      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </div>
  );
};

export default Landing;
