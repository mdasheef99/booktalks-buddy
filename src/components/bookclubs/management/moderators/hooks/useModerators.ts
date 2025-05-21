import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Moderator } from '../types';
import useUserEnrichment from './useUserEnrichment';

/**
 * Hook for managing moderators
 * 
 * This hook handles fetching, creating, and removing moderators.
 */
export function useModerators(clubId: string, userId: string | undefined) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const { enrichWithUserData } = useUserEnrichment();

  // Load moderators
  useEffect(() => {
    async function loadModerators() {
      if (!clubId || !userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch moderators
        let moderatorsData = [];
        try {
          const { data, error } = await supabase
            .from('club_moderators')
            .select('club_id, user_id, assigned_by_user_id, assigned_at')
            .eq('club_id', clubId);
            
          if (error) {
            console.error('Error loading moderators:', error);
            if (error.code === '42P01') { // Table doesn't exist
              console.warn('Moderators table does not exist yet');
              setModerators([]);
              return;
            } else {
              throw error;
            }
          } else {
            moderatorsData = data || [];
          }
        } catch (error) {
          console.error('Exception loading moderators:', error);
          toast.error('Failed to load moderators. Using cached data if available.');
          setModerators([]);
          return;
        }
        
        if (moderatorsData.length === 0) {
          setModerators([]);
        } else {
          // Enrich with user data
          const enrichedModerators = await enrichWithUserData(moderatorsData);
          setModerators(enrichedModerators);
        }
      } catch (error) {
        console.error('Error loading moderators:', error);
        toast.error('Failed to load moderators');
        setModerators([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadModerators();
  }, [clubId, userId, enrichWithUserData]);

  // Appoint moderator
  const appointModerator = useCallback(async (memberId: string) => {
    if (!clubId || !userId) return false;
    
    try {
      setProcessingAction(true);
      
      // Insert new moderator
      const { error } = await supabase
        .from('club_moderators')
        .insert({
          club_id: clubId,
          user_id: memberId,
          assigned_by_user_id: userId,
        });
        
      if (error) throw error;
      
      // Reload moderators
      const { data, error: fetchError } = await supabase
        .from('club_moderators')
        .select('club_id, user_id, assigned_by_user_id, assigned_at')
        .eq('club_id', clubId);
        
      if (fetchError) throw fetchError;
      
      // Enrich with user data
      const enrichedModerators = await enrichWithUserData(data || []);
      setModerators(enrichedModerators);
      
      toast.success('Moderator appointed successfully');
      return true;
    } catch (error) {
      console.error('Error appointing moderator:', error);
      toast.error('Failed to appoint moderator');
      return false;
    } finally {
      setProcessingAction(false);
    }
  }, [clubId, userId, enrichWithUserData]);

  // Remove moderator
  const removeModerator = useCallback(async (moderatorId: string) => {
    if (!clubId || !userId) return false;
    
    try {
      setProcessingAction(true);
      
      // Delete moderator
      const { error } = await supabase
        .from('club_moderators')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', moderatorId);
        
      if (error) throw error;
      
      // Update local state
      setModerators(moderators.filter(mod => mod.user_id !== moderatorId));
      
      toast.success('Moderator removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing moderator:', error);
      toast.error('Failed to remove moderator');
      return false;
    } finally {
      setProcessingAction(false);
    }
  }, [clubId, userId, moderators]);

  return {
    moderators,
    loading,
    processingAction,
    appointModerator,
    removeModerator
  };
}

export default useModerators;
