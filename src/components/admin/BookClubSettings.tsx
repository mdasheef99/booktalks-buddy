import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getClubDetails, updateBookClub, deleteBookClub } from '@/lib/api';

const BookClubSettings: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubDetails = async () => {
      if (!clubId) return;
      
      try {
        const clubData = await getClubDetails(clubId);
        setName(clubData.name);
        setDescription(clubData.description || '');
        setPrivacy(clubData.privacy || 'public');
      } catch (error) {
        console.error('Error fetching club details:', error);
        toast.error('Failed to load club details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubDetails();
  }, [clubId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a club name');
      return;
    }
    
    if (!clubId || !user?.id) {
      toast.error('Missing required information');
      return;
    }
    
    setSaving(true);
    
    try {
      await updateBookClub(user.id, clubId, {
        name: name.trim(),
        description: description.trim(),
        privacy
      });
      
      toast.success('Book club updated successfully');
    } catch (error) {
      console.error('Error updating book club:', error);
      toast.error('Failed to update book club');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clubId || !user?.id) return;
    
    if (!window.confirm('Are you sure you want to delete this book club? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    
    try {
      await deleteBookClub(user.id, clubId);
      toast.success('Book club deleted successfully');
      navigate('/book-club');
    } catch (error) {
      console.error('Error deleting book club:', error);
      toast.error('Failed to delete book club');
      setDeleting(false);
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/book-club/${clubId}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Book Club
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">Book Club Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Club Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for your book club"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your book club is about"
            rows={4}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Privacy Setting
          </label>
          <RadioGroup value={privacy} onValueChange={setPrivacy} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">Public</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private">Private</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-gray-500 mt-1">
            {privacy === 'public' 
              ? 'Anyone can see and join this club' 
              : 'Only invited members can join this club'}
          </p>
        </div>
        
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete Book Club'}
          </Button>
          
          <Button type="submit" disabled={saving || deleting}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookClubSettings;
