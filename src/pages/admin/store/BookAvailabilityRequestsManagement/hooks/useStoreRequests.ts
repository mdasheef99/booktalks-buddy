import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { BookAvailabilityRequestData } from '@/types/bookAvailabilityRequests';

interface UseStoreRequestsProps {
  storeId: string | null;
  activeTab: 'all' | 'club_members' | 'anonymous';
}

export const useStoreRequests = ({ storeId, activeTab }: UseStoreRequestsProps) => {
  const [requests, setRequests] = useState<BookAvailabilityRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch requests directly from Supabase
  const fetchRequests = async () => {
    if (!storeId) {
      console.log('No storeId available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching requests directly from Supabase for store:', storeId);

      // Query directly from Supabase
      const { data, error } = await supabase
        .from('book_availability_requests')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      console.log('Supabase query result:', { data: data?.length || 0, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Failed to fetch book availability requests');
      }

      setRequests(data || []);
      console.log('Successfully loaded', data?.length || 0, 'requests');
    } catch (err) {
      console.error('Error fetching book availability requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
      toast.error('Failed to fetch book availability requests');
    } finally {
      setLoading(false);
    }
  };

  // Get request counts for tabs
  const getRequestCounts = () => {
    const clubMemberRequests = requests.filter(r => r.request_source === 'authenticated_user');
    const anonymousRequests = requests.filter(r => r.request_source === 'anonymous');

    return {
      all: requests.length,
      club_members: clubMemberRequests.length,
      anonymous: anonymousRequests.length,
    };
  };

  // Update requests (used by request management hook)
  const updateRequests = (newRequests: BookAvailabilityRequestData[]) => {
    setRequests(newRequests);
  };

  // Retry fetch on error
  const retryFetch = () => {
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
  }, [storeId, activeTab]);

  return {
    requests,
    loading,
    error,
    fetchRequests,
    getRequestCounts,
    updateRequests,
    retryFetch
  };
};
