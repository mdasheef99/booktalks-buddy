/**
 * ReadingPreferencesSection Component
 * Handles favorite authors, genres, and reading frequency
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { X } from 'lucide-react';

// Reading frequency options
const READING_FREQUENCIES = [
  { value: 'voracious', label: 'Voracious (multiple books per week)' },
  { value: 'regular', label: 'Regular (a book every week or two)' },
  { value: 'casual', label: 'Casual (a book per month)' },
  { value: 'occasional', label: 'Occasional (a few books per year)' }
];

// Popular genres for selection
const GENRE_OPTIONS = [
  "Fiction", "Mystery", "Sci-Fi", "Romance", "Fantasy",
  "Thriller", "Non-Fiction", "Biography", "Poetry",
  "History", "Young Adult", "Classics"
];

interface ReadingPreferencesSectionProps {
  favoriteAuthor: string;
  favoriteAuthors: string[];
  favoriteGenre: string;
  favoriteGenres: string[];
  readingFrequency: string;
  onFavoriteAuthorChange: (value: string) => void;
  onAddFavoriteAuthor: (author: string) => void;
  onRemoveFavoriteAuthor: (author: string) => void;
  onFavoriteGenreChange: (genre: string) => void;
  onRemoveFavoriteGenre: (genre: string) => void;
  onReadingFrequencyChange: (frequency: string) => void;
}

const ReadingPreferencesSection: React.FC<ReadingPreferencesSectionProps> = ({
  favoriteAuthor,
  favoriteAuthors,
  favoriteGenre,
  favoriteGenres,
  readingFrequency,
  onFavoriteAuthorChange,
  onAddFavoriteAuthor,
  onRemoveFavoriteAuthor,
  onFavoriteGenreChange,
  onRemoveFavoriteGenre,
  onReadingFrequencyChange
}) => {
  // Handle adding author on Enter key
  const handleAuthorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (favoriteAuthor.trim() && !favoriteAuthors.includes(favoriteAuthor.trim())) {
        onAddFavoriteAuthor(favoriteAuthor.trim());
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-bookconnect-brown">Reading Preferences</h3>

      {/* Favorite Authors */}
      <div className="space-y-2">
        <Label className="text-bookconnect-brown">Favorite Authors</Label>
        
        {/* Authors List */}
        <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
          {favoriteAuthors.length > 0 ? (
            favoriteAuthors.map((author, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full text-sm"
              >
                <span>{author}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFavoriteAuthor(author)}
                  className="text-bookconnect-brown/70 hover:text-bookconnect-brown transition-colors"
                  aria-label={`Remove ${author} from favorite authors`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">Add your favorite authors</span>
          )}
        </div>
        
        {/* Author Input */}
        <Input
          placeholder="Type an author name and press Enter to add"
          value={favoriteAuthor}
          onChange={(e) => onFavoriteAuthorChange(e.target.value)}
          onKeyDown={handleAuthorKeyDown}
          className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage"
          aria-describedby="authors-help"
        />
        <p id="authors-help" className="text-xs text-gray-500">
          Press Enter to add an author to your favorites list
        </p>
      </div>

      {/* Favorite Genre */}
      <div className="space-y-2">
        <Label htmlFor="favoriteGenre" className="text-bookconnect-brown">
          Favorite Genre
        </Label>
        <Select value={favoriteGenre} onValueChange={onFavoriteGenreChange}>
          <SelectTrigger className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage">
            <SelectValue placeholder="Select a genre" />
          </SelectTrigger>
          <SelectContent>
            {GENRE_OPTIONS.map((genre) => (
              <SelectItem key={genre} value={genre} className="font-serif">
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Favorite Genres List */}
      <div className="space-y-2">
        <Label className="text-bookconnect-brown">Favorite Genres List</Label>
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {favoriteGenres.length > 0 ? (
            favoriteGenres.map((genre, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full text-sm"
              >
                <span>{genre}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFavoriteGenre(genre)}
                  className="text-bookconnect-brown/70 hover:text-bookconnect-brown transition-colors"
                  aria-label={`Remove ${genre} from favorite genres`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">Add your favorite genres</span>
          )}
        </div>
      </div>

      {/* Reading Frequency */}
      <div className="space-y-2">
        <Label htmlFor="readingFrequency" className="text-bookconnect-brown">
          How often do you read?
        </Label>
        <Select
          value={readingFrequency}
          onValueChange={onReadingFrequencyChange}
        >
          <SelectTrigger className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage">
            <SelectValue placeholder="Select your reading frequency" />
          </SelectTrigger>
          <SelectContent>
            {READING_FREQUENCIES.map((frequency) => (
              <SelectItem key={frequency.value} value={frequency.value} className="font-serif">
                {frequency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          This helps us match you with book clubs that fit your reading pace
        </p>
      </div>
    </div>
  );
};

export default ReadingPreferencesSection;
