
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { BookOpen, Calendar, Users } from "lucide-react";
import { UsernameDialog } from "@/components/dialogs/UsernameDialog";
import { GenreDialog } from "@/components/dialogs/GenreDialog";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");

  const handleUsernameComplete = (username: string) => {
    setCurrentUsername(username);
    setUsernameDialogOpen(false);
    setGenreDialogOpen(true);
  };

  const handleStartChatting = () => {
    setUsernameDialogOpen(true);
  };

  const handleBookClubsClick = () => {
    if (user) {
      navigate("/book-clubs");
    } else {
      navigate("/login", { state: { redirectTo: "/book-clubs" } });
    }
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
      <div 
        className="relative h-screen flex items-center justify-center text-center px-4 py-32 md:py-64"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="z-10 max-w-4xl">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-6">
            Meet through books, discover through conversations
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Join our community of book lovers and connect anonymously through your shared passion for reading
          </p>
          <Button 
            onClick={handleStartChatting}
            size="lg"
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white px-8 py-6 text-xl rounded-md"
          >
            <BookOpen className="mr-2" /> 
            Start Chatting Anonymously
          </Button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="bg-bookconnect-cream py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-bookconnect-brown text-center mb-8">
            Explore BookConnect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Button
              onClick={() => navigate("/events")}
              size="lg"
              variant="outline"
              className="py-8 border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-brown/10"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Events
            </Button>
            <Button
              onClick={handleBookClubsClick}
              size="lg" 
              variant="outline"
              className="py-8 border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-brown/10"
            >
              <Users className="mr-2 h-5 w-5" />
              Book Clubs
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-bookconnect-brown text-white mt-auto py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <span className="font-serif text-2xl font-semibold">BookConnect</span>
              </div>
              <p className="text-sm text-white/70 mt-1">
                © {new Date().getFullYear()} BookConnect. All rights reserved.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex space-x-6">
                <a href="#" className="text-sm text-white/70 hover:text-white">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-white/70 hover:text-white">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-white/70 hover:text-white">
                  Contact
                </a>
              </div>
              <div className="mt-2 text-right">
                <button 
                  onClick={() => navigate("/admin")}
                  className="text-xs text-white/50 hover:text-white/70"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

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
    </div>
  );
};

export default Landing;
