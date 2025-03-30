import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { BookOpen, Calendar, Users, BookIcon, ArrowRight, Library, Sparkles, MapPin, Clock } from "lucide-react";
import { UsernameDialog } from "@/components/dialogs/UsernameDialog";
import { GenreDialog } from "@/components/dialogs/GenreDialog";
import { LoginDialog } from "@/components/dialogs/LoginDialog";
import InteractiveBook, { AccessibleGenreSelector } from '@/components/books/interactive/InteractiveBook';

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
      
      {/* Interactive Book Section */}
      {showInteractiveBook && (
        <div id="interactive-book-section" className="relative bg-bookconnect-cream py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-bookconnect-brown mb-6 text-center">
                Choose Your Literary Journey
              </h2>
              <p className="text-center text-bookconnect-brown/80 mb-8">
                Open the book below and select a genre to start anonymous conversations with fellow readers
              </p>
            </div>
            
            {/* 3D Interactive Book */}
            <InteractiveBook />
            
            {/* Accessible Alternative */}
            <AccessibleGenreSelector />
          </div>
        </div>
      )}

      <div className="bg-bookconnect-parchment py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown text-center">
              Events
            </h2>
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
          </div>
          
          <p className="text-center text-bookconnect-brown/80 mb-12 max-w-2xl mx-auto">
            Join literary events, author meet-ups, and book festivals happening in your community
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-bookconnect-sage/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/30"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium">
                    Upcoming
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl font-semibold mb-2 text-bookconnect-brown">Author Reading: Jane Austen</h3>
                <div className="flex items-center text-bookconnect-brown/70 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">October 15, 2023</span>
                </div>
                <div className="flex items-center text-bookconnect-brown/70 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">City Library, Downtown</span>
                </div>
                <p className="text-bookconnect-brown/80 text-sm mb-4">
                  Join us for a special reading and discussion of Jane Austen's classic works and their impact on modern literature.
                </p>
                <Button
                  onClick={handleEventsClick}
                  variant="outline"
                  className="w-full border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
                >
                  View Details
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-bookconnect-olive/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/30"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium">
                    Popular
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl font-semibold mb-2 text-bookconnect-brown">Poetry Night</h3>
                <div className="flex items-center text-bookconnect-brown/70 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">October 22, 2023</span>
                </div>
                <div className="flex items-center text-bookconnect-brown/70 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">Cozy Cafe, Art District</span>
                </div>
                <p className="text-bookconnect-brown/80 text-sm mb-4">
                  An evening of poetry readings from both published and amateur poets, featuring works from various genres and styles.
                </p>
                <Button
                  onClick={handleEventsClick}
                  variant="outline"
                  className="w-full border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
                >
                  View Details
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-bookconnect-cream/60 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/30"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl font-semibold mb-2 text-bookconnect-brown">Book Festival</h3>
                <div className="flex items-center text-bookconnect-brown/70 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">November 5-7, 2023</span>
                </div>
                <div className="flex items-center text-bookconnect-brown/70 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">City Convention Center</span>
                </div>
                <p className="text-bookconnect-brown/80 text-sm mb-4">
                  A three-day celebration of literature with author signings, panel discussions, workshops, and a book fair.
                </p>
                <Button
                  onClick={handleEventsClick}
                  variant="outline"
                  className="w-full border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
                >
                  View All Events
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-bookconnect-cream py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown text-center">
              Book Clubs
            </h2>
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
          </div>
          
          <p className="text-center text-bookconnect-brown/80 mb-12 max-w-2xl mx-auto">
            Join vibrant reading communities centered around your favorite genres and authors
          </p>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div 
                className="md:w-1/2 h-64 md:h-auto relative overflow-hidden"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1530538987395-032d1800fdd4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-bookconnect-brown/70 to-transparent md:bg-gradient-to-r"></div>
                <div className="absolute bottom-4 left-4 md:hidden">
                  <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Featured Club
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 p-6 md:p-10">
                <div className="hidden md:flex mb-4">
                  <div className="bg-bookconnect-terracotta/10 text-bookconnect-terracotta px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Featured Book Club
                  </div>
                </div>
                <h3 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-bookconnect-brown">Classic Literature Club</h3>
                <div className="flex items-center mb-2">
                  <BookOpen className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                  <span className="text-bookconnect-brown">Currently reading: Pride and Prejudice</span>
                </div>
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                  <span className="text-bookconnect-brown">Weekly meetings on Thursdays</span>
                </div>
                <p className="text-bookconnect-brown/80 mb-6 leading-relaxed">
                  Dive into timeless classics with our passionate community of readers. From Jane Austen to Charles Dickens, we explore the rich tapestry of classic literature through thoughtful discussions and insights.
                </p>
                <Button 
                  onClick={handleBookClubClick}
                  size="lg"
                  className="bg-bookconnect-brown hover:bg-bookconnect-brown/90 text-white px-6 group"
                >
                  Join Book Club
                  <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-bookconnect-cream/50 hover:shadow-lg transition-all duration-300">
              <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown">Science Fiction Club</h4>
              <p className="text-bookconnect-brown/80 mb-4 text-sm">
                Explore futuristic worlds and technological wonders with fellow sci-fi enthusiasts.
              </p>
              <Button 
                onClick={handleBookClubsClick}
                className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-bookconnect-cream/50 hover:shadow-lg transition-all duration-300">
              <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown">Mystery Readers</h4>
              <p className="text-bookconnect-brown/80 mb-4 text-sm">
                Unravel puzzles and solve crimes alongside detectives from the greatest mystery novels.
              </p>
              <Button 
                onClick={handleBookClubsClick}
                className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-bookconnect-cream/50 hover:shadow-lg transition-all duration-300">
              <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown">Contemporary Fiction</h4>
              <p className="text-bookconnect-brown/80 mb-4 text-sm">
                Discuss modern literary works and their reflections on today's society and culture.
              </p>
              <Button 
                onClick={handleBookClubsClick}
                className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-4 bg-bookconnect-sage/30 relative overflow-hidden">
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

      <footer className="bg-bookconnect-brown text-white pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-6">
                <BookOpen className="h-7 w-7 mr-3 text-bookconnect-terracotta" />
                <span className="font-serif text-2xl font-semibold">BookConnect</span>
              </div>
              <p className="text-white/70 mb-6 leading-relaxed">
                Connecting book lovers through meaningful conversations and literary exploration since 2023.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-bookconnect-terracotta/70 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-bookconnect-terracotta/70 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-bookconnect-terracotta/70 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.01-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.045-1.064.207-1.504.344-1.857.182-.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold mb-6 border-b border-white/20 pb-2">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white/70 hover:text-bookconnect-terracotta transition-colors">Home</a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-bookconnect-terracotta transition-colors">About Us</a>
                </li>
                <li>
                  <a href="#" onClick={handleEventsClick} className="text-white/70 hover:text-bookconnect-terracotta transition-colors">Events</a>
                </li>
                <li>
                  <a href="#" onClick={handleBookClubsClick} className="text-white/70 hover:text-bookconnect-terracotta transition-colors">Book Clubs</a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-bookconnect-terracotta transition-colors">Blog</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold mb-6 border-b border-white/20 pb-2">Newsletter</h3>
              <p className="text-white/70 mb-4">
                Stay updated with the latest literary events and book recommendations.
              </p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 py-2 px-4 rounded-l-md w-full focus:outline-none focus:ring-1 focus:ring-bookconnect-terracotta"
                />
                <button className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta text-white py-2 px-4 rounded-r-md transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-white/70">
                © {new Date().getFullYear()} BookConnect. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                Contact
              </a>
              <button 
                onClick={handleAdminClick}
                className="text-xs text-white/50 hover:text-white/70 transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </footer>

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
