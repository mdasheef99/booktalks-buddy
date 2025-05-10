import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { getClubs } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];
type BookClubInsert = Database['public']['Tables']['book_clubs']['Insert'];
type ClubMember = Database['public']['Tables']['club_members']['Row'];
type ClubMemberInsert = Database['public']['Tables']['club_members']['Insert'];

// BookClubCard component to handle individual club cards
interface BookClubCardProps {
  club: BookClub;
  onClick: () => void;
}

const BookClubCard: React.FC<BookClubCardProps> = ({ club, onClick }) => {
  const navigate = useNavigate();
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
      className="overflow-hidden cursor-pointer h-64 flex flex-col"
      onClick={onClick}
    >
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">{club.name}</h3>
        </div>
        <div className="h-20 overflow-hidden relative mb-2">
          <p
            ref={descriptionRef}
            className="text-muted-foreground max-h-20"
          >
            {club.description || 'No description available'}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
        </div>
        <div className="mt-auto">
          {isOverflowing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
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

export const BookClubList: React.FC = () => {
  const [bookClubs, setBookClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're coming from club details
  const fromClubDetails = location.state?.fromClubDetails;

  // Fetch book clubs
  useEffect(() => {
    const fetchBookClubs = async () => {
      try {
        if (!user?.id) {
          console.log('User not authenticated, skipping fetch');
          setLoading(false);
          return;
        }

        console.log('Fetching book clubs for user:', user.id);
        const clubs = await getClubs(user.id);
        console.log('Fetched clubs:', clubs);
        setBookClubs(clubs);
      } catch (error) {
        console.error('Error fetching book clubs:', error);
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
        }, (payload) => {
          console.log('Change received:', payload);
          fetchBookClubs(); // Refresh the list when changes occur
        })
        .subscribe();

      return () => {
        console.log('Unsubscribing from book_clubs_channel');
        subscription.unsubscribe();
      };
    }
  }, [user?.id]); // Add user?.id as dependency to re-run when user changes


  console.log('Loading state:', loading);
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