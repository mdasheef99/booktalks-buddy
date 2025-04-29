import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { joinOrRequestClub, cancelJoinRequest } from '@/lib/api';

export const useClubMembership = (clubId: string | undefined, clubPrivacy?: string, onStatusChange?: () => void) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleJoinClub = async () => {
    if (!clubId || !user?.id) return;

    setActionInProgress(true);
    try {
      const result = await joinOrRequestClub(user.id, clubId);
      toast.success(result.message);

      // Call the callback to refresh data
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      console.error('Error joining club:', error);
      toast.error(error.message || 'Failed to join club. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!clubId || !user?.id) return;

    setActionInProgress(true);
    try {
      const result = await cancelJoinRequest(user.id, clubId);
      toast.success(result.message);

      // Call the callback to refresh data
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error(error.message || 'Failed to cancel request. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!clubId || !user?.id) return;

    setActionInProgress(true);
    try {
      // Call API to leave club
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('user_id', user.id)
        .eq('club_id', clubId);

      if (error) throw error;

      toast.success('You have left the book club');
      navigate('/book-club');
    } catch (error: any) {
      console.error('Error leaving club:', error);
      toast.error(error.message || 'Failed to leave the club. Please try again.');
      setShowLeaveConfirm(false);
    } finally {
      setActionInProgress(false);
    }
  };

  return {
    actionInProgress,
    showLeaveConfirm,
    setShowLeaveConfirm,
    handleJoinClub,
    handleCancelRequest,
    handleLeaveClub
  };
};

export default useClubMembership;
