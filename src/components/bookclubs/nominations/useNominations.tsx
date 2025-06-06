import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNominations } from '@/lib/api/bookclubs/nominations';
import { Nomination } from '@/lib/api/bookclubs/types';
import { isClubMember } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { useCanManageClub } from '@/lib/entitlements/hooks';

interface UseNominationsProps {
  clubId: string;
}

interface UseNominationsReturn {
  nominations: Nomination[];
  loading: boolean;
  error: string | null;
  status: 'active' | 'selected' | 'archived' | 'all';
  sortOrder: 'likes' | 'newest';
  isMember: boolean;
  isAdmin: boolean;
  clubName: string;
  fetchNominations: () => Promise<void>;
  handleSortOrderChange: (newOrder: 'likes' | 'newest') => void;
  handleStatusChange: (newStatus: 'active' | 'selected' | 'archived' | 'all') => void;
}

export function useNominations({ clubId }: UseNominationsProps): UseNominationsReturn {
  const { user } = useAuth();

  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'selected' | 'archived' | 'all'>('active');
  const [sortOrder, setSortOrder] = useState<'likes' | 'newest'>('likes');
  const [isMember, setIsMember] = useState(false);
  const [clubName, setClubName] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');

  // Use enhanced entitlements hook for admin check
  const { result: isAdmin } = useCanManageClub(clubId, storeId);

  useEffect(() => {
    if (!clubId || !user?.id) return;

    const checkPermissions = async () => {
      try {
        const memberStatus = await isClubMember(user.id, clubId);
        setIsMember(memberStatus);
      } catch (err) {
        console.error('Error checking permissions:', err);
        setError('Failed to verify club membership');
      }
    };

    const fetchClubData = async () => {
      try {
        const { data, error } = await supabase
          .from('book_clubs')
          .select('name, store_id')
          .eq('id', clubId)
          .single();

        if (error) throw error;
        setClubName(data?.name || 'Book Club');
        setStoreId(data?.store_id || '');
      } catch (err) {
        console.error('Error fetching club data:', err);
        setClubName('Book Club');
        setStoreId('');
      }
    };

    checkPermissions();
    fetchClubData();
  }, [clubId, user?.id]);

  useEffect(() => {
    if (clubId && user?.id && isMember) {
      fetchNominations();
    }
  }, [clubId, user?.id, isMember, status]);

  const fetchNominations = async () => {
    if (!clubId || !user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const fetchedNominations = await getNominations(clubId, user.id, status);

      // Sort nominations based on current sort order
      const sortedNominations = [...fetchedNominations].sort((a, b) => {
        if (sortOrder === 'likes') {
          return b.like_count - a.like_count;
        } else {
          return new Date(b.nominated_at).getTime() - new Date(a.nominated_at).getTime();
        }
      });

      setNominations(sortedNominations);
    } catch (err) {
      console.error('Error fetching nominations:', err);
      setError('Failed to load book nominations');
    } finally {
      setLoading(false);
    }
  };

  const handleSortOrderChange = (newOrder: 'likes' | 'newest') => {
    setSortOrder(newOrder);

    // Re-sort the existing nominations without fetching again
    const sortedNominations = [...nominations].sort((a, b) => {
      if (newOrder === 'likes') {
        return b.like_count - a.like_count;
      } else {
        return new Date(b.nominated_at).getTime() - new Date(a.nominated_at).getTime();
      }
    });

    setNominations(sortedNominations);
  };

  const handleStatusChange = (newStatus: 'active' | 'selected' | 'archived' | 'all') => {
    setStatus(newStatus);
    // This will trigger the useEffect to fetch nominations with the new status
  };

  return {
    nominations,
    loading,
    error,
    status,
    sortOrder,
    isMember,
    isAdmin,
    clubName,
    fetchNominations,
    handleSortOrderChange,
    handleStatusChange
  };
}
