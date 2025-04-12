
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Loader2, X } from "lucide-react";

interface ProfileFormProps {
  onCancel: () => void;
  onProfileUpdated: () => void;
}

// Reading frequency options
const READING_FREQUENCIES = [
  { value: 'voracious', label: 'Voracious (multiple books per week)' },
  { value: 'regular', label: 'Regular (a book every week or two)' },
  { value: 'casual', label: 'Casual (a book per month)' },
  { value: 'occasional', label: 'Occasional (a few books per year)' }
];

// Meeting time options
const MEETING_TIMES = [
  { value: 'weekday_mornings', label: 'Weekday Mornings' },
  { value: 'weekday_afternoons', label: 'Weekday Afternoons' },
  { value: 'weekday_evenings', label: 'Weekday Evenings' },
  { value: 'weekend_mornings', label: 'Weekend Mornings' },
  { value: 'weekend_afternoons', label: 'Weekend Afternoons' },
  { value: 'weekend_evenings', label: 'Weekend Evenings' }
];

// Popular genres for selection
const GENRE_OPTIONS = [
  "Fiction", "Mystery", "Sci-Fi", "Romance", "Fantasy",
  "Thriller", "Non-Fiction", "Biography", "Poetry",
  "History", "Young Adult", "Classics"
];

const ProfileForm: React.FC<ProfileFormProps> = ({
  onCancel,
  onProfileUpdated
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteAuthor, setFavoriteAuthor] = useState('');
  const [favoriteAuthors, setFavoriteAuthors] = useState<string[]>([]);
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [readingFrequency, setReadingFrequency] = useState<string>('');
  const [preferredMeetingTimes, setPreferredMeetingTimes] = useState<string[]>([]);

  // Character limits
  const BIO_CHAR_LIMIT = 500;

  // Load existing profile data
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { data: { user: userData } } = await supabase.auth.getUser();

        if (userData?.user_metadata) {
          const metadata = userData.user_metadata;

          setUsername(metadata.username || '');
          setDisplayName(metadata.display_name || '');
          setBio(metadata.bio || '');
          setFavoriteAuthors(metadata.favorite_authors || []);
          if (metadata.favorite_author) {
            setFavoriteAuthor(metadata.favorite_author);
            if (!metadata.favorite_authors?.includes(metadata.favorite_author)) {
              setFavoriteAuthors(prev => [...prev, metadata.favorite_author]);
            }
          }
          setFavoriteGenres(metadata.favorite_genres || []);
          if (metadata.favorite_genre) {
            setFavoriteGenre(metadata.favorite_genre);
            if (!metadata.favorite_genres?.includes(metadata.favorite_genre)) {
              setFavoriteGenres(prev => [...prev, metadata.favorite_genre]);
            }
          }
          setReadingFrequency(metadata.reading_frequency || '');
          setPreferredMeetingTimes(metadata.preferred_meeting_times || []);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      }
    };

    loadProfile();
  }, [user]);

  // Handle meeting time toggle
  const toggleMeetingTime = (value: string) => {
    setPreferredMeetingTimes(prev =>
      prev.includes(value)
        ? prev.filter(time => time !== value)
        : [...prev, value]
    );
  };

  // Handle adding a genre
  const handleGenreChange = (genre: string) => {
    setFavoriteGenre(genre);
    if (!favoriteGenres.includes(genre)) {
      setFavoriteGenres(prev => [...prev, genre]);
    }
  };

  // Handle removing a genre
  const removeGenre = (genre: string) => {
    setFavoriteGenres(prev => prev.filter(g => g !== genre));
    if (favoriteGenre === genre) {
      setFavoriteGenre('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    // Validate form
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (bio.length > BIO_CHAR_LIMIT) {
      toast.error(`Bio must be ${BIO_CHAR_LIMIT} characters or less`);
      return;
    }

    setSaving(true);

    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          username,
          display_name: displayName,
          bio,
          favorite_author: favoriteAuthor,
          favorite_authors: favoriteAuthors,
          favorite_genre: favoriteGenre,
          favorite_genres: favoriteGenres,
          reading_frequency: readingFrequency,
          preferred_meeting_times: preferredMeetingTimes
        }
      });

      if (error) throw error;

      toast.success('Profile updated successfully');
      onProfileUpdated();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-serif text-bookconnect-brown mb-4">Edit Your Profile</h2>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-bookconnect-brown">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-bookconnect-brown">Username*</Label>
            <Input
              id="username"
              placeholder="Your unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-bookconnect-brown">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your public display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage"
            />
          </div>
        </div>

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
            rows={4}
            className="font-serif resize-none border-bookconnect-brown/30 focus:ring-bookconnect-sage"
          />
        </div>
      </div>

      {/* Reading Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-bookconnect-brown">Reading Preferences</h3>

        {/* Favorite Authors */}
        <div className="space-y-2">
          <Label className="text-bookconnect-brown">Favorite Authors</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {favoriteAuthors.map((author, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full text-sm"
              >
                {author}
                <button
                  type="button"
                  onClick={() => setFavoriteAuthors(prev => prev.filter(a => a !== author))}
                  className="text-bookconnect-brown/70 hover:text-bookconnect-brown"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {favoriteAuthors.length === 0 && (
              <span className="text-sm text-gray-500 italic">Add your favorite authors</span>
            )}
          </div>
          <Input
            placeholder="Type an author name and press Enter to add"
            value={favoriteAuthor}
            onChange={(e) => setFavoriteAuthor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (favoriteAuthor && !favoriteAuthors.includes(favoriteAuthor)) {
                  setFavoriteAuthors(prev => [...prev, favoriteAuthor]);
                  setFavoriteAuthor('');
                }
              }
            }}
            className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage"
          />
        </div>

        {/* Favorite Genre */}
        <div className="space-y-2">
          <Label htmlFor="favoriteGenre" className="text-bookconnect-brown">Favorite Genre</Label>
          <Select value={favoriteGenre} onValueChange={handleGenreChange}>
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
          <div className="flex flex-wrap gap-2">
            {favoriteGenres.map((genre, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full text-sm"
              >
                {genre}
                <button
                  type="button"
                  onClick={() => removeGenre(genre)}
                  className="text-bookconnect-brown/70 hover:text-bookconnect-brown"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {favoriteGenres.length === 0 && (
              <span className="text-sm text-gray-500 italic">Add your favorite genres</span>
            )}
          </div>
        </div>

        {/* Reading Frequency */}
        <div className="space-y-2">
          <Label htmlFor="readingFrequency" className="text-bookconnect-brown">How often do you read?</Label>
          <Select
            value={readingFrequency}
            onValueChange={setReadingFrequency}
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
        </div>
      </div>

      {/* BookClub Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-bookconnect-brown">BookClub Preferences</h3>

        <div className="space-y-2">
          <Label className="text-bookconnect-brown">Preferred Meeting Times</Label>
          <div className="grid grid-cols-2 gap-2">
            {MEETING_TIMES.map((time) => (
              <div key={time.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`time-${time.value}`}
                  checked={preferredMeetingTimes.includes(time.value)}
                  onCheckedChange={() => toggleMeetingTime(time.value)}
                  className="text-bookconnect-terracotta border-bookconnect-brown/30"
                />
                <label
                  htmlFor={`time-${time.value}`}
                  className="text-sm font-serif leading-none text-bookconnect-brown"
                >
                  {time.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="text-bookconnect-brown border-bookconnect-brown/30"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
