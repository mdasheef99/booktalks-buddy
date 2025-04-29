import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface BookClub {
  id: string;
  name: string;
  description: string | null;
  privacy: string | null;
  created_at: string;
}

const AdminClubManagementPage: React.FC = () => {
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAllClubs = async () => {
      try {
        const { data, error } = await supabase
          .from('book_clubs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClubs(data || []);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast.error('Failed to load book clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchAllClubs();
  }, []);

  const handleCreateClub = () => {
    navigate('/book-club/new');
  };

  const handleEditClub = (clubId: string) => {
    navigate(`/book-club/${clubId}/settings`);
  };

  const handleViewMembers = (clubId: string) => {
    navigate(`/book-club/${clubId}/members`);
  };

  const handleViewDiscussions = (clubId: string) => {
    navigate(`/book-club/${clubId}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        <div className="h-12 w-32 bg-gray-300 rounded"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/dashboard')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">Book Club Management</h1>

      <Button
        onClick={handleCreateClub}
        className="mb-6 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Club
      </Button>

      <div className="space-y-4">
        {clubs.length > 0 ? (
          clubs.map((club) => (
            <Card key={club.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{club.name}</h3>
                    <p className="text-muted-foreground mt-1">
                      {club.description || 'No description available'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-bookconnect-sage/20 text-bookconnect-sage px-2 py-1 rounded-full">
                        {club.privacy || 'public'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created: {new Date(club.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMembers(club.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDiscussions(club.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Discussions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClub(club.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No book clubs found</p>
              <Button
                onClick={handleCreateClub}
                className="mt-4 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Club
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminClubManagementPage;
