import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { getClubs, getCreatedClubs, getJoinedClubs } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import ClubPhotoDisplay from './photos/ClubPhotoDisplay';
import ClubMemberCount from './ClubMemberCount';

// Extended type to include photo properties that may not be in generated types
type BookClub = Database['public']['Tables']['book_clubs']['Row'] & {
  cover_photo_url?: string | null;
  cover_photo_thumbnail_url?: string | null;
};

// BookClubCard component to handle individual club cards
interface BookClubListProps {
  clubType?: 'all' | 'created' | 'joined';
}

interface BookClubCardProps {
  club: BookClub;
  onClick: () => void;
}

const BookClubCard: React.FC<BookClubCardProps> = ({ club, onClick }) => {
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    // Check if the description is overflowing
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    }
  }, [club.description]);

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* Photo Section */}
      <div className="h-48">
        <ClubPhotoDisplay
          photoUrl={club.cover_photo_url}
          thumbnailUrl={club.cover_photo_thumbnail_url}
          clubName={club.name}
          size="medium"
          aspectRatio="16:9"
          className="w-full h-full"
        />
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold line-clamp-1">{club.name}</h3>
          <ClubMemberCount
            clubId={club.id}
            initialCount={0} // Will be fetched by the component
            size="small"
            realTimeUpdates={false} // Disable for performance in lists
          />
        </div>

        <div className="h-16 overflow-hidden relative mb-3">
          <p
            ref={descriptionRef}
            className="text-muted-foreground text-sm max-h-16 line-clamp-3"
          >
            {club.description || 'No description available'}
          </p>
          {isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent"></div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className={`text-xs px-2 py-1 rounded-full ${
            club.privacy === 'private'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {club.privacy || 'public'}
          </span>

          {isOverflowing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 p-0 h-auto font-medium text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              Read more
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export const BookClubList: React.FC<BookClubListProps> = ({ clubType = 'all' }) => {
  const [bookClubs, setBookClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch book clubs
  useEffect(() => {
    const fetchBookClubs = async () => {
      try {
        if (!user?.id) {
          setLoading(false);
          return;
        }

        let clubs: BookClub[];
        switch (clubType) {
          case 'created':
            clubs = await getCreatedClubs(user.id);
            break;
          case 'joined':
            clubs = await getJoinedClubs(user.id);
            break;
          default:
            clubs = await getClubs(user.id);
            break;
        }
        setBookClubs(clubs);
      } catch (error) {
        toast.error('Failed to load book clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchBookClubs();

    // Only set up subscription if user is authenticated
    if (user?.id) {
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('book_clubs_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'book_clubs'
        }, () => {
          fetchBookClubs(); // Refresh the list when changes occur
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, clubType]); // Add user?.id and clubType as dependencies


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookClubs.map((club) => (
          <BookClubCard
            key={club.id}
            club={club}
            onClick={() => navigate(`/book-club/${club.id}`, {
              state: { fromBookClubList: true }
            })}
          />
        ))}
      </div>
    </div>
  );
};

export default BookClubList;