
import { useState } from "react";
import * as Sentry from "@sentry/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface GenreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

const genres = [
  { name: "Fiction", color: "bg-blue-500" },
  { name: "Mystery", color: "bg-red-500" },
  { name: "Sci-Fi", color: "bg-indigo-600" },
  { name: "Romance", color: "bg-pink-500" },
  { name: "Fantasy", color: "bg-purple-500" },
  { name: "Thriller", color: "bg-orange-600" },
  { name: "Non-Fiction", color: "bg-green-600" },
  { name: "Biography", color: "bg-yellow-600" },
  { name: "Poetry", color: "bg-teal-500" },
  { name: "History", color: "bg-amber-700" },
  { name: "Young Adult", color: "bg-cyan-600" },
  { name: "Classics", color: "bg-emerald-600" }
];

export const GenreDialog = ({ open, onOpenChange, username }: GenreDialogProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      <DialogContent className="sm:max-w-xl bg-bookconnect-cream border-bookconnect-brown/30 shadow-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-bookconnect-brown text-center">
            Choose Genres
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <p className="text-center text-bookconnect-brown/80 mb-4">
            What kind of books would you like to explore? Select multiple genres if you want!
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {genres.map((genre) => (
              <button
                key={genre.name}
                className={`${genre.color} rounded-lg p-3 h-16 text-white font-medium transition-transform hover:scale-105 ${
                  selectedGenres.includes(genre.name) ? "ring-4 ring-white ring-offset-2 ring-offset-bookconnect-brown/20" : ""
                }`}
                onClick={() => handleGenreToggle(genre.name)}
              >
                {genre.name}
                {selectedGenres.includes(genre.name) && (
                  <span className="ml-1 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Switch
              id="location"
              checked={locationEnabled}
              onCheckedChange={setLocationEnabled}
            />
            <Label htmlFor="location" className="text-bookconnect-brown/80 text-sm">
              Enable Location? (Optional)
            </Label>
          </div>
          <p className="text-center text-xs text-bookconnect-brown/70">
            Turn on location for a bookstore experience
          </p>
          
          <Button 
            onClick={handleExplore}
            disabled={selectedGenres.length === 0}
            className="w-full mt-4 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
          >
            Explore Books ({selectedGenres.length} {selectedGenres.length === 1 ? 'genre' : 'genres'} selected)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
