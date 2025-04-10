
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ProfileFormProps {
  favoriteAuthor: string;
  setFavoriteAuthor: (author: string) => void;
  favoriteGenre: string;
  setFavoriteGenre: (genre: string) => void;
  bio: string;
  setBio: (bio: string) => void;
}

const GENRE_OPTIONS = [
  "Fiction", "Mystery", "Sci-Fi", "Romance", "Fantasy", 
  "Thriller", "Non-Fiction", "Biography", "Poetry", 
  "History", "Young Adult", "Classics"
];

const ProfileForm: React.FC<ProfileFormProps> = ({
  favoriteAuthor,
  setFavoriteAuthor,
  favoriteGenre,
  setFavoriteGenre,
  bio,
  setBio
}) => {
  return (
    <>
      {/* Favorite Author */}
      <div className="space-y-2">
        <label htmlFor="favoriteAuthor" className="block text-sm font-medium text-bookconnect-brown">
          Favorite Author
        </label>
        <Input
          id="favoriteAuthor"
          value={favoriteAuthor}
          onChange={(e) => setFavoriteAuthor(e.target.value)}
          placeholder="Favorite Author"
          className="font-serif rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bookconnect-sage transition"
          maxLength={50}
          style={{ borderColor: '#B8A088' }}
        />
      </div>

      {/* Favorite Genre */}
      <div className="space-y-2">
        <label htmlFor="favoriteGenre" className="block text-sm font-medium text-bookconnect-brown">
          Favorite Genre
        </label>
        <Select value={favoriteGenre} onValueChange={setFavoriteGenre}>
          <SelectTrigger className="font-serif rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bookconnect-sage transition" style={{ borderColor: '#B8A088' }}>
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

      {/* Bio */}
      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium text-bookconnect-brown">
          Bio
        </label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="About me"
          className="font-serif rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bookconnect-sage transition"
          maxLength={50}
          style={{ borderColor: '#B8A088' }}
        />
      </div>
    </>
  );
};

export default ProfileForm;
