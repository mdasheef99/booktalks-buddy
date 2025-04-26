import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Popular genres for selection
const GENRE_OPTIONS = [
  "Fiction", "Mystery", "Sci-Fi", "Romance", "Fantasy",
  "Thriller", "Non-Fiction", "Biography", "Poetry",
  "History", "Young Adult", "Classics"
];

interface SimpleProfileFormProps {
  favoriteAuthor: string;
  setFavoriteAuthor: (author: string) => void;
  favoriteGenre: string;
  setFavoriteGenre: (genre: string) => void;
  bio: string;
  setBio: (bio: string) => void;
}

const SimpleProfileForm: React.FC<SimpleProfileFormProps> = ({
  favoriteAuthor,
  setFavoriteAuthor,
  favoriteGenre,
  setFavoriteGenre,
  bio,
  setBio
}) => {
  // Character limits
  const BIO_CHAR_LIMIT = 300;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="bio" className="text-bookconnect-brown">Bio</Label>
          <span className={`text-xs ${bio.length > BIO_CHAR_LIMIT ? 'text-red-500' : 'text-gray-500'}`}>
            {bio.length}/{BIO_CHAR_LIMIT}
          </span>
        </div>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself and your reading interests..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="font-serif resize-none border-bookconnect-brown/30 focus:ring-bookconnect-sage"
        />
      </div>

      {/* Reading Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-bookconnect-brown">Reading Preferences</h3>

        {/* Favorite Author */}
        <div className="space-y-2">
          <Label htmlFor="favoriteAuthor" className="text-bookconnect-brown">Favorite Author</Label>
          <Input
            id="favoriteAuthor"
            placeholder="Your favorite author"
            value={favoriteAuthor}
            onChange={(e) => setFavoriteAuthor(e.target.value)}
            className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage"
          />
        </div>

        {/* Favorite Genre */}
        <div className="space-y-2">
          <Label htmlFor="favoriteGenre" className="text-bookconnect-brown">Favorite Genre</Label>
          <Select value={favoriteGenre} onValueChange={setFavoriteGenre}>
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
      </div>
    </div>
  );
};

export default SimpleProfileForm;
