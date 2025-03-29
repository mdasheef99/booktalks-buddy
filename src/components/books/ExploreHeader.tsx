
import React from "react";

interface ExploreHeaderProps {
  genres: string[];
  primaryGenre: string;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({ genres, primaryGenre }) => {
  return (
    <div className="mb-12">
      <h1 className="text-4xl md:text-6xl font-serif font-bold text-bookconnect-brown text-center mb-4 tracking-tight">
        Explore Books
      </h1>
      <div className="w-16 h-1 bg-bookconnect-terracotta mx-auto mb-4"></div>
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
