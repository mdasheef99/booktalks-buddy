
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, MapPin, Sparkles } from "lucide-react";

interface GenreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

const genres = [
  { name: "Fiction", color: "from-blue-500 to-blue-600" },
  { name: "Mystery", color: "from-red-500 to-red-600" },
  { name: "Sci-Fi", color: "from-indigo-500 to-indigo-700" },
  { name: "Romance", color: "from-pink-400 to-pink-600" },
  { name: "Fantasy", color: "from-purple-500 to-purple-700" },
  { name: "Thriller", color: "from-orange-500 to-orange-700" },
  { name: "Non-Fiction", color: "from-green-500 to-green-700" },
  { name: "Biography", color: "from-yellow-500 to-amber-600" },
  { name: "Poetry", color: "from-teal-500 to-teal-700" },
  { name: "History", color: "from-amber-600 to-amber-800" },
  { name: "Young Adult", color: "from-cyan-500 to-cyan-700" },
  { name: "Classics", color: "from-emerald-500 to-emerald-700" }
];

export const GenreDialog = ({ open, onOpenChange, username }: GenreDialogProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Animate the genre cards on initial load
  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const handleExplore = () => {
    try {
      const primaryGenre = selectedGenres.length > 0 ? selectedGenres[0] : "Fiction";
      localStorage.setItem("selected_genres", JSON.stringify(selectedGenres));
      localStorage.setItem("selected_genre", primaryGenre); // For backward compatibility
      
      if (locationEnabled) {
        localStorage.setItem("location_enabled", "true");
      }
      
      toast({
        title: "Ready to explore!",
        description: `Welcome ${username}, enjoy exploring ${selectedGenres.length > 1 ? 'your selected genres' : primaryGenre} books!`,
      });
      
      // Store the username in localStorage for consistent usage across the app
      localStorage.setItem("anon_username", username);
      
      // Navigate to the Explore Books page with a comma-separated list of genres
      navigate(`/explore-books?genre=${selectedGenres.join(',')}`);
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Something went wrong",
        description: "We couldn't process your selection. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-gradient-to-br from-bookconnect-cream to-white border-bookconnect-brown/30 shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-bookconnect-terracotta" />
            <DialogTitle className="text-2xl font-serif text-bookconnect-brown text-center">
              Choose Your Literary Adventure
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto pr-4">
          <div className="space-y-6 pt-2">
            <p className="text-center text-bookconnect-brown/80 font-serif italic">
              What kind of books inspire your imagination? Select multiple genres to curate your perfect reading experience.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {genres.map((genre, index) => (
                <button
                  key={genre.name}
                  className={`bg-gradient-to-br ${genre.color} rounded-lg p-3 h-16 text-white font-medium transition-all shadow-md
                    hover:shadow-lg hover:scale-[1.03] ${
                    selectedGenres.includes(genre.name) ? "ring-2 ring-white ring-offset-2 ring-offset-bookconnect-brown/20 scale-[1.02]" : ""
                    } ${isAnimating ? `animate-fade-in opacity-0` : 'opacity-100'}`}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'forwards'
                  }}
                  onClick={() => handleGenreToggle(genre.name)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif">{genre.name}</span>
                    {selectedGenres.includes(genre.name) && (
                      <span className="bg-white/30 rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex items-center justify-center space-x-3 p-4 mt-4 bg-bookconnect-cream/50 rounded-lg border border-bookconnect-brown/10">
              <MapPin className="h-5 w-5 text-bookconnect-brown/70" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="location"
                    checked={locationEnabled}
                    onCheckedChange={setLocationEnabled}
                    className="data-[state=checked]:bg-bookconnect-terracotta"
                  />
                  <Label htmlFor="location" className="text-bookconnect-brown text-sm font-medium">
                    Enable Location Services
                  </Label>
                </div>
                <p className="text-xs text-bookconnect-brown/70 mt-1">
                  Find bookstores and reading events near you
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="mt-6 pt-4 border-t border-bookconnect-brown/20">
          <Button 
            onClick={handleExplore}
            disabled={selectedGenres.length === 0}
            className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white font-serif flex items-center gap-2"
          >
            <BookOpen className="h-5 w-5" />
            Explore Books ({selectedGenres.length} {selectedGenres.length === 1 ? 'genre' : 'genres'} selected)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
