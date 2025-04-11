import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createBookClub } from '@/lib/api';

const CreateBookClubForm: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a club name');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to create a book club');
      return;
    }

    setLoading(true);

    try {
      const club = await createBookClub(user.id, {
        name: name.trim(),
        description: description.trim(),
        privacy
      });

      toast.success('Book club created successfully');
      navigate(`/book-club/${club.id}`);
    } catch (error) {
      console.error('Error creating book club:', error);
      toast.error('Failed to create book club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/book-club')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Book Clubs
      </Button>
      <h1 className="text-2xl font-bold mb-6">Create New Book Club</h1>

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

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/book-club')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Book Club'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateBookClubForm;
