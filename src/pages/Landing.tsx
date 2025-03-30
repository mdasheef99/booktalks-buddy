
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet";
import { UsernameDialog } from "@/components/dialogs/UsernameDialog";
import { GenreDialog } from "@/components/dialogs/GenreDialog";
import { LoginDialog } from "@/components/dialogs/LoginDialog";

// Import the new component sections
import HeroSection from "@/components/landing/HeroSection";
import InteractiveBookSection from "@/components/landing/InteractiveBookSection";
import EventsSection from "@/components/landing/EventsSection";
import BookClubsSection from "@/components/landing/BookClubsSection";
import QuoteSection from "@/components/landing/QuoteSection";
import FooterSection from "@/components/landing/FooterSection";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [showInteractiveBook, setShowInteractiveBook] = useState(false);

  const handleUsernameComplete = (username: string) => {
    setCurrentUsername(username);
    setUsernameDialogOpen(false);
    setGenreDialogOpen(true);
  };

  const handleStartChatting = () => {
    setShowInteractiveBook(true);
    // Smooth scroll to the interactive book section
    setTimeout(() => {
      document.getElementById('interactive-book-section')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
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

  const handleAdminClick = () => {
    navigate("/admin-dashboard");
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

      {/* Hero Section */}
      <HeroSection handleStartChatting={handleStartChatting} />
      
      {/* Interactive Book Section */}
      <InteractiveBookSection showInteractiveBook={showInteractiveBook} />

      {/* Events Section */}
      <EventsSection handleEventsClick={handleEventsClick} />

      {/* Book Clubs Section */}
      <BookClubsSection 
        handleBookClubClick={handleBookClubClick} 
        handleBookClubsClick={handleBookClubsClick} 
      />

      {/* Quote Section */}
      <QuoteSection />

      {/* Footer Section */}
      <FooterSection 
        handleEventsClick={handleEventsClick}
        handleBookClubsClick={handleBookClubsClick}
        handleAdminClick={handleAdminClick}
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
