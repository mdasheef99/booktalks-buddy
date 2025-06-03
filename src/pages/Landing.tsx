
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { UsernameDialog } from "@/components/dialogs/UsernameDialog";
import { GenreDialog } from "@/components/dialogs/GenreDialog";
import { LoginDialog } from "@/components/dialogs/LoginDialog";

// Import the new component sections
import CarouselSection from "@/components/landing/CarouselSection";
import HeroSection from "@/components/landing/HeroSection";
import PromotionalBannersSection from "@/components/landing/PromotionalBannersSection";
import EventsSection from "@/components/landing/events";
import BookClubsSection from "@/components/landing/BookClubsSection";
import QuoteSection from "@/components/landing/QuoteSection";
import { CommunityShowcaseSection } from "@/components/landing/CommunityShowcaseSection";
import FooterSection from "@/components/landing/FooterSection";
import { useStoreId } from "@/hooks/useStoreId";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { storeId } = useStoreId();
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
