
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, Book, Heart, Zap, Sparkles, Globe, User, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatSelection = () => {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get("genre");

  const [username, setUsername] = useState("");
  const [genre, setGenre] = useState(initialGenre || "");
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const genreOptions = [
    { name: "Fiction", icon: Book, description: "Stories from imagination" },
    { name: "Mystery", icon: Sparkles, description: "Puzzles and suspense" },
    { name: "Romance", icon: Heart, description: "Love and relationships" },
    { name: "Sci-Fi", icon: Zap, description: "Future and technology" },
    { name: "Fantasy", icon: Sparkles, description: "Magic and adventure" },
    { name: "Non-Fiction", icon: Globe, description: "Real world topics" },
    { name: "Biography", icon: User, description: "Life stories" },
    { name: "History", icon: Clock, description: "Past events and eras" }
  ];

  // Map URL param genres to our select options
  useEffect(() => {
    if (initialGenre) {
      const genreMap: Record<string, string> = {
        'fiction': 'Fiction',
        'mystery': 'Mystery',
        'romance': 'Romance',
        'scifi': 'Sci-Fi',
        'fantasy': 'Fantasy',
        'nonfiction': 'Non-Fiction'
      };
      
      if (genreMap[initialGenre.toLowerCase()]) {
        setGenre(genreMap[initialGenre.toLowerCase()]);
      }
    }
    
    // Check if username is already in localStorage
    const savedUsername = localStorage.getItem("anon_username") || localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, [initialGenre]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Username required. Please enter a username to continue.");
      return;
    }

    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }

    setCurrentStep(2);
  };

  const handleGenreSelect = (selectedGenre: string) => {
    setGenre(selectedGenre);
  };

  const handleFinalSubmit = async () => {
    if (!genre) {
      toast.error("Genre required. Please select a genre to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Store the username consistently in both localStorage keys
      localStorage.setItem("anon_username", username);
      localStorage.setItem("username", username);
      localStorage.setItem("selected_genre", genre);

      console.log("Chat selection complete, username:", username, "genre:", genre);

      // Simulate a brief loading state for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to explore books for anonymous chat
      navigate(`/explore-books?genre=${encodeURIComponent(genre)}`);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
              currentStep >= 1
                ? "bg-bookconnect-terracotta border-bookconnect-terracotta text-white"
                : "border-bookconnect-brown/30 text-bookconnect-brown/50"
            )}>
              {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <div className={cn(
              "h-1 w-16 transition-all duration-300",
              currentStep >= 2 ? "bg-bookconnect-terracotta" : "bg-bookconnect-brown/20"
            )} />
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
              currentStep >= 2
                ? "bg-bookconnect-terracotta border-bookconnect-terracotta text-white"
                : "border-bookconnect-brown/30 text-bookconnect-brown/50"
            )}>
              {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-bookconnect-brown/70">
            <span>Username</span>
            <span>Genre</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-center mb-6">
            <div className="bg-bookconnect-terracotta/10 p-3 rounded-full">
              <BookOpen className="h-8 w-8 text-bookconnect-terracotta" />
            </div>
          </div>

          <h1 className="text-3xl font-serif font-bold text-bookconnect-brown mb-6 text-center">
            {currentStep === 1 ? "Choose Your Username" : "Select Your Genre"}
          </h1>

          {currentStep === 1 ? (
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-bookconnect-brown">
                  Choose a Username
                </label>
                <Input
                  id="username"
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-bookconnect-brown/30 focus-visible:ring-bookconnect-terracotta focus-visible"
                  aria-describedby="username-help"
                  minLength={3}
                  maxLength={20}
                />
                <p id="username-help" className="text-xs text-bookconnect-brown/60">
                  This anonymous username will only be used for this chat session (3-20 characters)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 focus-visible"
                disabled={!username.trim() || username.trim().length < 3}
              >
                Continue to Genre Selection
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-bookconnect-brown/70">
                  Welcome, <span className="font-semibold text-bookconnect-brown">{username}</span>!
                  Now choose your preferred book genre.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {genreOptions.map((genreOption) => {
                  const IconComponent = genreOption.icon;
                  return (
                    <Card
                      key={genreOption.name}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                        genre === genreOption.name
                          ? "border-bookconnect-terracotta bg-bookconnect-terracotta/5"
                          : "border-bookconnect-brown/20 hover:border-bookconnect-terracotta/50"
                      )}
                      onClick={() => handleGenreSelect(genreOption.name)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={genre === genreOption.name}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleGenreSelect(genreOption.name);
                        }
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={cn(
                          "mx-auto mb-2 w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                          genre === genreOption.name
                            ? "bg-bookconnect-terracotta text-white"
                            : "bg-bookconnect-brown/10 text-bookconnect-brown"
                        )}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-bookconnect-brown mb-1">
                          {genreOption.name}
                        </h3>
                        <p className="text-xs text-bookconnect-brown/60">
                          {genreOption.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-brown/5 focus-visible"
                >
                  Back
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  disabled={!genre || isSubmitting}
                  className="flex-1 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 focus-visible"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Chat...
                    </>
                  ) : (
                    "Start Chatting"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSelection;
