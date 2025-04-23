
import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";

interface BookSearchFormProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const BookSearchForm: React.FC<BookSearchFormProps> = ({ onSearch, isSearching }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 800); // Increased debounce delay to reduce API calls

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      onSearch(searchQuery);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      e.preventDefault();
      onSearch(searchQuery);
    }
  };

  // Trigger search on debounced query change
  React.useEffect(() => {
    // Only search if query is at least 3 characters long to reduce API calls
    if (debouncedQuery && debouncedQuery.trim().length > 2) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  return (
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
      <div className="flex items-center p-3 bg-white border-2 border-bookconnect-brown/40 rounded-lg shadow-md"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1519677584237-752f8853252e?q=80&w=1470&auto=format&fit=crop')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundBlendMode: "overlay",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            }}>
        <Input
          type="text"
          placeholder="Search by title, author, or keyword..."
          className="flex-grow border-none bg-transparent focus-visible:ring-0 text-bookconnect-brown placeholder:text-bookconnect-brown/50 font-serif"
          style={{ fontFamily: "Georgia, serif" }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="submit"
          className="ml-2 bg-bookconnect-brown hover:bg-bookconnect-brown/80"
          aria-label="Search for books"
          disabled={isSearching || searchQuery.trim().length === 0}
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span className="ml-1">Search</span>
        </Button>
      </div>
    </form>
  );
};

export default BookSearchForm;
