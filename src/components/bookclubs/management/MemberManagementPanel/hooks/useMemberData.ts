/**
 * useMemberData Hook
 * Handles data loading and processing for member management
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getClubMembers } from '@/lib/api/bookclubs/members';
import { getClubJoinRequests } from '@/lib/api/bookclubs/requests';
import { processMemberData, processJoinRequestData } from '../utils/memberDataProcessing';
import type { Member, JoinRequest, ProcessedMemberData } from '../types/memberManagement';

interface UseMemberDataProps {
  clubId: string;
}

interface UseMemberDataReturn {
  members: Member[];
  joinRequests: JoinRequest[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateMembers: (newMembers: Member[]) => void;
  updateJoinRequests: (newRequests: JoinRequest[]) => void;
}

export function useMemberData({ clubId }: UseMemberDataProps): UseMemberDataReturn {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!clubId || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load members
      const membersData = await getClubMembers(clubId);
      const processedMembers = processMemberData(membersData);
      setMembers(processedMembers);

      // Load join requests
      const requestsData = await getClubJoinRequests(clubId);
      const processedRequests = processJoinRequestData(requestsData);
      setJoinRequests(processedRequests);

    } catch (error) {
      console.error('Error loading club members data:', error);
      const errorMessage = 'Failed to load members data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [clubId, user?.id]);

  const refreshData = async () => {
    await loadData();
  };

  const updateMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
  };

  const updateJoinRequests = (newRequests: JoinRequest[]) => {
    setJoinRequests(newRequests);
  };

  return {
    members,
    joinRequests,
    loading,
    error,
    refreshData,
    updateMembers,
    updateJoinRequests
  };
}
