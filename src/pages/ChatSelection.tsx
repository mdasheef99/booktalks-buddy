
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

const ChatSelection = () => {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get("genre");
  
  const [username, setUsername] = useState("");
  const [genre, setGenre] = useState(initialGenre || "");
  const navigate = useNavigate();

  const genres = ["Fiction", "Mystery", "Romance", "Sci-Fi", "Fantasy", "Non-Fiction", "Biography", "History"];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error("Username required. Please enter a username to continue.");
      return;
    }
    
    if (!genre) {
      toast.error("Genre required. Please select a genre to continue.");
      return;
    }

    // Store the username consistently in both localStorage keys
    localStorage.setItem("anon_username", username);
    localStorage.setItem("username", username);
    localStorage.setItem("selected_genre", genre);
    
    console.log("Chat selection complete, username:", username, "genre:", genre);
    
    // Navigate to explore books for anonymous chat
    navigate(`/explore-books?genre=${encodeURIComponent(genre)}`);
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream py-20 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-center mb-6">
          <div className="bg-bookconnect-terracotta/10 p-3 rounded-full">
            <BookOpen className="h-8 w-8 text-bookconnect-terracotta" />
          </div>
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-bookconnect-brown mb-6 text-center">
          Start Chatting
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-bookconnect-brown">
              Choose a Username
            </label>
            <Input
              id="username"
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-bookconnect-brown/30 focus-visible:ring-bookconnect-terracotta"
            />
            <p className="text-xs text-bookconnect-brown/60">
              This anonymous username will only be used for this chat session
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="genre" className="text-sm font-medium text-bookconnect-brown">
              Select Book Genre
            </label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-full border-bookconnect-brown/30">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatSelection;
