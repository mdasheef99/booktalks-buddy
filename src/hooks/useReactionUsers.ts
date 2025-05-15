import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getUserProfiles, UserProfile } from '@/services/profileService';
import { ReactionCount } from './useReactions';

export interface ReactionUser {
  userId: string;
  profile: UserProfile | null;
}

export interface UseReactionUsersReturn {
  reactionUsers: ReactionUser[];
  loading: boolean;
  fetchUsers: (reaction: ReactionCount) => Promise<void>;
  clearUsers: () => void;
}

/**
 * Custom hook to manage users who reacted with a specific emoji
 */
export function useReactionUsers(): UseReactionUsersReturn {
  const [reactionUsers, setReactionUsers] = useState<ReactionUser[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch users who reacted with a specific emoji
   */
  const fetchUsers = useCallback(async (reaction: ReactionCount) => {
    if (!reaction || !reaction.userIds.length) {
      setReactionUsers([]);
      return;
    }

    try {
      setLoading(true);
      setReactionUsers([]); // Clear previous users while loading

      // Get user profiles for all users who reacted with this emoji
      const userProfiles = await getUserProfiles(reaction.userIds);

      // Convert to array of ReactionUser objects
      const users: ReactionUser[] = reaction.userIds.map(userId => ({
        userId,
        profile: userProfiles.get(userId) || null
      }));

      setReactionUsers(users);
    } catch (error) {
      console.error('Error fetching reaction users:', error);
      toast.error('Failed to load user information');
      setReactionUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear the users list
   */
  const clearUsers = useCallback(() => {
    setReactionUsers([]);
  }, []);

  return {
    reactionUsers,
    loading,
    fetchUsers,
    clearUsers
  };
}
