import React from 'react';
import { Settings, Edit, Trash2, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import { getClubDetails, updateBookClub, deleteBookClub } from '@/lib/api';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];

interface AdminClubManagementProps {
  clubId: string;
}

export const AdminClubManagement: React.FC<AdminClubManagementProps> = ({ clubId }) => {
  const [club, setClub] = React.useState<BookClub | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [privacy, setPrivacy] = React.useState('public');
  const { user } = useAuth();

  React.useEffect(() => {
    const fetchClub = async () => {
      try {
        const data = await getClubDetails(clubId);
        setClub(data);
        setName(data.name);
        setDescription(data.description || '');
        setPrivacy(data.privacy || 'public');
      } catch (error) {
        console.error('Error fetching club:', error);
        toast.error('Failed to load club details');
      } finally {
        setLoading(false);
      }
    };

    fetchClub();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('club_management_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'book_clubs',
        filter: `id=eq.${clubId}`
      }, () => {
        fetchClub();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clubId]);

  const handleSave = async () => {
    if (!club) return;

    try {
      await updateBookClub(user!.id, clubId, {
        name: name.trim(),
        description: description.trim() || null,
        privacy,
      });

      toast.success('Club details updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating club:', error);
      toast.error('Failed to update club details');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this book club? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBookClub(user!.id, clubId);

      toast.success('Book club deleted successfully');
      // Navigate back to clubs list or dashboard
      window.location.href = '/bookclubs';
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
  };

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

  if (!club) {
    return (
      <div className="text-center p-8">
        <p>Book club not found</p>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Club Settings</h2>
        </div>
        {!editMode && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Club
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Club Name
          </label>
          {editMode ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter club name"
            />
          ) : (
            <p className="text-gray-900">{club.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          {editMode ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter club description"
              rows={4}
            />
          ) : (
            <p className="text-gray-900">{club.description || 'No description'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Privacy
          </label>
          {editMode ? (
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          ) : (
            <p className="text-gray-900 capitalize">{club.privacy || 'Public'}</p>
          )}
        </div>

        {editMode && (
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setEditMode(false);
                setName(club.name);
                setDescription(club.description || '');
                setPrivacy(club.privacy || 'public');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdminClubManagement;