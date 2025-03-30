
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { BookOpen, Calendar, Users, BookIcon, ArrowRight, Library, Sparkles } from "lucide-react";
import { UsernameDialog } from "@/components/dialogs/UsernameDialog";
import { GenreDialog } from "@/components/dialogs/GenreDialog";
import { LoginDialog } from "@/components/dialogs/LoginDialog";
import { supabase } from "@/lib/supabase";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");

  const handleUsernameComplete = (username: string) => {
    setCurrentUsername(username);
    setUsernameDialogOpen(false);
    setGenreDialogOpen(true);
  };

  const handleStartChatting = () => {
    setUsernameDialogOpen(true);
  };

  const handleBookClubClick = async () => {
    if (user) {
      navigate("/book-club");
    } else {
      // Show login dialog for non-authenticated users
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
      <div 
        className="relative min-h-[90vh] flex items-center justify-center text-center px-4 py-24 md:py-36 overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Floating book elements */}
        <div className="absolute w-full h-full overflow-hidden">
          <div className="absolute top-[15%] left-[10%] opacity-20 rotate-12 transform scale-75 md:scale-100">
            <BookIcon className="w-16 h-16 text-bookconnect-cream" />
          </div>
          <div className="absolute top-[35%] right-[12%] opacity-20 -rotate-6 transform scale-75 md:scale-100">
            <BookOpen className="w-20 h-20 text-bookconnect-terracotta" />
          </div>
          <div className="absolute bottom-[20%] left-[20%] opacity-20 rotate-3 transform scale-75 md:scale-100">
            <Library className="w-14 h-14 text-bookconnect-sage" />
          </div>
          <div className="absolute top-[60%] right-[25%] opacity-20 -rotate-12 transform scale-75 md:scale-100">
            <Sparkles className="w-10 h-10 text-bookconnect-cream" />
          </div>
        </div>
        
        <div className="z-10 max-w-4xl animate-fade-in">
          <span className="inline-block px-4 py-1 rounded-full bg-bookconnect-terracotta/20 text-bookconnect-cream text-sm font-medium tracking-wide mb-6 backdrop-blur-sm border border-bookconnect-terracotta/30">
            Welcome to BookConnect
          </span>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl text-white font-bold mb-6 leading-tight">
            Connect Through <span className="relative">Books
              <span className="absolute bottom-1 left-0 w-full h-2 bg-bookconnect-terracotta/40"></span>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join our community of book lovers and connect anonymously through your shared passion for reading
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button 
              onClick={handleStartChatting}
              size="lg"
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white px-8 py-7 text-xl rounded-md transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg group"
            >
              <BookOpen className="mr-2" /> 
              Start Chatting Anonymously
              <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
            
            <Button 
              onClick={handleBookClubClick}
              size="lg"
              className="bg-[#5c4033] hover:bg-[#5c4033]/90 text-white px-8 py-7 text-xl rounded-md transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg"
            >
              <BookIcon className="mr-2 h-6 w-6" /> 
              Book Club
            </Button>
          </div>
          
          <div className="mt-12 flex justify-center">
            <div className="animate-bounce p-2 bg-white/10 rounded-full backdrop-blur-sm">
              <svg className="w-6 h-6 text-bookconnect-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="bg-bookconnect-cream py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown text-center">
              Explore BookConnect
            </h2>
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
          </div>
          
          <p className="text-center text-bookconnect-brown/80 mb-12 max-w-2xl mx-auto">
            Discover a world of literary connections, events, and communities tailored for passionate readers like you
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="group">
              <Button
                onClick={() => navigate("/events")}
                size="lg"
                variant="outline"
                className="w-full py-10 border-2 border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-brown/5 transition-all duration-300 flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-bookconnect-terracotta/10 flex items-center justify-center group-hover:bg-bookconnect-terracotta/20 transition-all">
                  <Calendar className="h-8 w-8 text-bookconnect-terracotta" />
                </div>
                <span className="text-xl font-serif">Literary Events</span>
                <span className="text-sm text-bookconnect-brown/70 max-w-xs text-center">
                  Discover book readings, author meet-ups, and literary festivals near you
                </span>
              </Button>
            </div>
            
            <div className="group">
              <Button
                onClick={handleBookClubsClick}
                size="lg" 
                variant="outline"
                className="w-full py-10 border-2 border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-brown/5 transition-all duration-300 flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-bookconnect-terracotta/10 flex items-center justify-center group-hover:bg-bookconnect-terracotta/20 transition-all">
                  <Users className="h-8 w-8 text-bookconnect-terracotta" />
                </div>
                <span className="text-xl font-serif">Book Clubs</span>
                <span className="text-sm text-bookconnect-brown/70 max-w-xs text-center">
                  Join passionate reading groups and engage in meaningful discussions
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quote Banner */}
      <div className="py-16 px-4 bg-bookconnect-parchment relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <svg className="h-12 w-12 text-bookconnect-terracotta opacity-50 mx-auto mb-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 11C10 8.22 7.77 6 5 6V15C5 17.77 7.22 20 10 20V11Z" fill="currentColor" />
            <path d="M19 11C19 8.22 16.77 6 14 6V15C14 17.77 16.22 20 19 20V11Z" fill="currentColor" />
          </svg>
          
          <p className="text-xl md:text-2xl lg:text-3xl font-serif italic font-medium text-bookconnect-brown">
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </p>
          <div className="mt-4 text-bookconnect-brown/70">— George R.R. Martin</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-bookconnect-brown text-white mt-auto py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <BookOpen className="h-7 w-7 mr-3 text-bookconnect-terracotta" />
                <span className="font-serif text-2xl font-semibold">BookConnect</span>
              </div>
              <p className="text-sm text-white/70 mt-3 max-w-md">
                Connecting book lovers through meaningful conversations and literary exploration.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex space-x-8 mb-4">
                <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Contact
                </a>
              </div>
              <p className="text-sm text-white/70">
                © {new Date().getFullYear()} BookConnect. All rights reserved.
              </p>
              <div className="mt-4">
                <button 
                  onClick={handleAdminClick}
                  className="text-xs text-white/50 hover:text-white/70 transition-colors"
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
      
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </div>
  );
};

export default Landing;
