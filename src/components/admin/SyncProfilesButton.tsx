import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * Button component to sync the current user's profile data from auth metadata to the users table
 */
const SyncProfilesButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);

  const syncCurrentUserProfile = async () => {
    try {
      setSyncing(true);
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
        toast.error('Failed to get current user');
        return;
      }
      
      if (!user) {
        toast.error('No user is currently logged in');
        return;
      }
      
      // Get the user's metadata
      const metadata = user.user_metadata || {};
      
      console.log('Syncing profile data:', {
        bio: metadata.bio,
        favorite_authors: metadata.favorite_authors,
        favorite_genres: metadata.favorite_genres
      });
      
      // Update the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          bio: metadata.bio || null,
          favorite_authors: metadata.favorite_authors || null,
          favorite_genres: metadata.favorite_genres || null
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating user profile:', updateError);
        toast.error('Failed to sync profile data');
        return;
      }
      
      toast.success('Profile data synced successfully');
    } catch (error) {
      console.error('Error syncing profile:', error);
      toast.error('An error occurred while syncing profile data');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button 
      onClick={syncCurrentUserProfile}
      disabled={syncing}
      variant="outline"
      size="sm"
    >
      {syncing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Syncing...
        </>
      ) : (
        'Sync Profile Data'
      )}
    </Button>
  );
};

export default SyncProfilesButton;
