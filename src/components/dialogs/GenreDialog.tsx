
import { useState } from "react";
import * as Sentry from "@sentry/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedGenre, setSelectedGenre] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
  };

  const handleExplore = () => {
    try {
      localStorage.setItem("selected_genre", selectedGenre);
      
      if (locationEnabled) {
        localStorage.setItem("location_enabled", "true");
      }
      
      toast({
        title: "Ready to explore!",
        description: `Welcome ${username}, enjoy exploring ${selectedGenre} books!`,
      });
      
      // Navigate to books filtered by genre
      navigate(`/books?genre=${selectedGenre}`);
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
            Choose a Genre
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <p className="text-center text-bookconnect-brown/80 mb-4">
            What kind of books would you like to explore?
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {genres.map((genre) => (
              <button
                key={genre.name}
                className={`${genre.color} rounded-lg p-3 h-16 text-white font-medium transition-transform hover:scale-105 ${
                  selectedGenre === genre.name ? "ring-4 ring-white ring-offset-2 ring-offset-bookconnect-brown/20" : ""
                }`}
                onClick={() => handleGenreSelect(genre.name)}
              >
                {genre.name}
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
            disabled={!selectedGenre}
            className="w-full mt-4 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
          >
            Explore Books
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
