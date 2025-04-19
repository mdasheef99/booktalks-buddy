import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserMetadata, READING_FREQUENCY_LABELS } from './types';

interface ProfilePreferencesProps {
  userMetadata: UserMetadata;
}

const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({ userMetadata }) => {
  return (
    <Card className="border-bookconnect-brown/20 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-bookconnect-brown">Reading Preferences</CardTitle>
        <CardDescription>Your favorite genres, authors, and reading habits</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-6">
          {/* Favorite Genres */}
          <div>
            <h3 className="text-lg font-medium mb-2 font-serif text-bookconnect-brown">Favorite Genres</h3>
            {userMetadata.favorite_genres && userMetadata.favorite_genres.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userMetadata.favorite_genres.map((genre: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-bookconnect-cream text-bookconnect-brown border border-bookconnect-brown/20"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No favorite genres added yet</p>
            )}
          </div>

          {/* Favorite Authors */}
          <div>
            <h3 className="text-lg font-medium mb-2 font-serif text-bookconnect-brown">Favorite Authors</h3>
            {userMetadata.favorite_authors && userMetadata.favorite_authors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userMetadata.favorite_authors.map((author: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-bookconnect-brown/30 text-bookconnect-brown"
                  >
                    {author}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No favorite authors added yet</p>
            )}
          </div>

          {/* Reading Frequency */}
          <div>
            <h3 className="text-lg font-medium mb-2 font-serif text-bookconnect-brown">Reading Frequency</h3>
            {userMetadata.reading_frequency ? (
              <p className="font-serif">
                {READING_FREQUENCY_LABELS[userMetadata.reading_frequency] || userMetadata.reading_frequency}
              </p>
            ) : (
              <p className="text-gray-500 italic">No reading frequency specified</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePreferences;
