import React from 'react';
import { useNavigate } from 'react-router-dom';
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

export const BookClubList: React.FC = () => {
  const [bookClubs, setBookClubs] = React.useState<BookClub[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch book clubs
  React.useEffect(() => {
    const fetchBookClubs = async () => {
      try {
        if (!user?.id) throw new Error('User not authenticated');

        const clubs = await getClubs(user.id);
        setBookClubs(clubs);
      } catch (error) {
        console.error('Error fetching book clubs:', error);
        toast.error('Failed to load book clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchBookClubs();

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
      subscription.unsubscribe();
    };
  }, []);


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
      <Button onClick={() => navigate('/book-club/new')} className="mb-4">
        Create New Club
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookClubs.map((club) => (
          <Card
            key={club.id}
            className="overflow-hidden cursor-pointer"
            onClick={() => navigate(`/book-club/${club.id}`)}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">{club.name}</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                {club.description || 'No description available'}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookClubList;