
import React from "react";

interface ExploreHeaderProps {
  genres: string[];
  primaryGenre: string;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({ genres, primaryGenre }) => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-bookconnect-brown text-center">
        Explore Books
      </h1>
      <p className="text-center text-bookconnect-brown/70 mt-2 font-serif max-w-2xl mx-auto">
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
