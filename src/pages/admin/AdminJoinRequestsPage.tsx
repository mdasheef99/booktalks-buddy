import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLoadProfiles } from '@/contexts/UserProfileContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getPendingJoinRequests, approveJoinRequest, denyJoinRequest } from '@/lib/api';

// Import custom components
import JoinRequestCard from '@/components/admin/JoinRequestCard';
import JoinRequestFilters from '@/components/admin/JoinRequestFilters';
import JoinRequestSorting from '@/components/admin/JoinRequestSorting';
import EmptyState from '@/components/admin/EmptyState';

// Import custom hook
import { useJoinRequestsFiltering } from '@/hooks/admin/useJoinRequestsFiltering';

interface JoinRequest {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  club_name?: string;
  username?: string;
}

const AdminJoinRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Use our custom hook for filtering and sorting
  const {
    sortField,
    setSortField,
    sortOrder,
    toggleSortOrder,
    filterClub,
    setFilterClub,
    searchQuery,
    setSearchQuery,
    availableClubs,
    filteredRequests,
    clearFilters
  } = useJoinRequestsFiltering(requests);

  // Load profiles for all requests
  useLoadProfiles(requests, (request) => request.user_id);

  useEffect(() => {
    const fetchJoinRequests = async () => {
      try {
        setLoading(true);
        const enrichedRequests = await getPendingJoinRequests();
        setRequests(enrichedRequests);
      } catch (error: any) {
        console.error('Error fetching join requests:', error);
        toast.error(error.message || 'Failed to load join requests');
      } finally {
        setLoading(false);
      }
    };

    fetchJoinRequests();

    // Set up real-time subscription for join requests
    const subscription = supabase
      .channel('join_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_members',
        filter: 'role=eq.pending'
      }, () => {
        fetchJoinRequests();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRequest = async (userId: string, clubId: string, approve: boolean) => {
    // Create a unique key for this request
    const requestKey = `${userId}-${clubId}`;

    // Set processing state for this specific request
    setProcessingRequests(prev => ({ ...prev, [requestKey]: true }));

    try {
      if (approve) {
        // Approve the request using the API function
        const result = await approveJoinRequest(userId, clubId);
        toast.success(result.message);
      } else {
        // Deny the request using the API function
        const result = await denyJoinRequest(userId, clubId);
        toast.success(result.message);
      }

      // Update local state
      setRequests(prev => prev.filter(req => !(req.user_id === userId && req.club_id === clubId)));
    } catch (error: any) {
      console.error('Error handling join request:', error);
      toast.error(error.message || `Failed to ${approve ? 'approve' : 'reject'} request. Please try again.`);
    } finally {
      // Clear processing state
      setProcessingRequests(prev => ({ ...prev, [requestKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-300 rounded"></div>
          <div className="h-24 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // Get request key
  const getRequestKey = (userId: string, clubId: string) => `${userId}-${clubId}`;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/dashboard')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">Join Requests</h1>

      {/* Sorting and Filtering Controls */}
      {requests.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Filters */}
          <JoinRequestFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterClub={filterClub}
            onFilterClubChange={setFilterClub}
            availableClubs={availableClubs}
          />

          {/* Sorting */}
          <JoinRequestSorting
            sortField={sortField}
            onSortFieldChange={setSortField}
            sortOrder={sortOrder}
            onSortOrderToggle={toggleSortOrder}
          />
        </div>
      )}

      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const requestKey = getRequestKey(request.user_id, request.club_id);
            const isProcessing = processingRequests[requestKey];

            return (
              <JoinRequestCard
                key={requestKey}
                request={request}
                isProcessing={isProcessing}
                onApprove={() => handleRequest(request.user_id, request.club_id, true)}
                onDeny={() => handleRequest(request.user_id, request.club_id, false)}
              />
            );
          })
        ) : requests.length > 0 ? (
          <EmptyState type="no-matches" onClearFilters={clearFilters} />
        ) : (
          <EmptyState type="no-requests" />
        )}
      </div>
    </div>
  );
};

export default AdminJoinRequestsPage;
