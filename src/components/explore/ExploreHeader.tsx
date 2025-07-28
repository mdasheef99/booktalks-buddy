
import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate
import { BookOpen, Sparkles } from "lucide-react";

interface ExploreHeaderProps {
  genres: string[];
  primaryGenre: string;
}
const ExploreHeader: React.FC<ExploreHeaderProps> = ({ genres, primaryGenre }) => {
  const navigate = useNavigate();
  return (
    <div className="mb-12 text-center relative">
      <Link
        to="/"
        className="absolute left-0 top-0 flex items-center gap-1 text-bookconnect-brown hover:text-bookconnect-terracotta transition-colors focus-visible"
        aria-label="Go back to home page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back
      </Link>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="h-6 w-6 text-bookconnect-terracotta" />
        <span className="text-sm font-medium uppercase tracking-wider text-bookconnect-terracotta">Discover</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-serif font-bold text-bookconnect-brown text-center mb-4 tracking-tight">
        Explore Books
      </h1>
      
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="h-0.5 w-12 bg-bookconnect-terracotta"></div>
        <BookOpen className="h-5 w-5 text-bookconnect-terracotta" />
        <div className="h-0.5 w-12 bg-bookconnect-terracotta"></div>
      </div>
      
      <p className="text-center text-bookconnect-brown/80 mt-2 font-serif max-w-2xl mx-auto text-lg">
        {genres.length > 1
          ? `Discover amazing reads in ${genres.slice(0, 3).join(', ')}${genres.length > 3 ? '...' : ''}`
          : primaryGenre
            ? `Discover amazing reads in ${primaryGenre}`
            : "Find your next favorite book"}
      </p>
    </div>
  );
};

export default ExploreHeader;
