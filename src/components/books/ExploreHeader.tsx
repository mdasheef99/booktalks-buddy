
import React from "react";
import { BookOpen, Sparkles } from "lucide-react";

interface ExploreHeaderProps {
  genres: string[];
  primaryGenre: string;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({ genres, primaryGenre }) => {
  return (
    <div className="mb-12 text-center">
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
      
      {genres.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {genres.map(genre => (
            <span 
              key={genre} 
              className="px-3 py-1.5 bg-bookconnect-terracotta/10 text-bookconnect-brown text-sm rounded-full border border-bookconnect-terracotta/20"
            >
              {genre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreHeader;
