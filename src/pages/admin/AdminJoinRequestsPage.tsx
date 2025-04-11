import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  X,
  UserPlus,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Calendar,
  Loader2
} from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import { useLoadProfiles } from '@/contexts/UserProfileContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { getPendingJoinRequests, approveJoinRequest, denyJoinRequest } from '@/lib/api';

interface JoinRequest {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  club_name?: string;
  username?: string;
}

type SortField = 'date' | 'username' | 'club_name';
type SortOrder = 'asc' | 'desc';

const AdminJoinRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});

  // Sorting and filtering state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterClub, setFilterClub] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableClubs, setAvailableClubs] = useState<{id: string, name: string}[]>([]);

  // Load profiles for all requests
  useLoadProfiles(requests, (request) => request.user_id);

  useEffect(() => {
    const fetchJoinRequests = async () => {
      try {
        setLoading(true);
        const enrichedRequests = await getPendingJoinRequests();

        if (enrichedRequests.length === 0) {
          setRequests([]);
          setFilteredRequests([]);
          setAvailableClubs([]);
          return;
        }

        // Extract unique clubs for filtering
        const uniqueClubs = Array.from(new Set(enrichedRequests.map(req => req.club_id)))
          .map(clubId => {
            const club = enrichedRequests.find(req => req.club_id === clubId);
            return { id: clubId, name: club?.club_name || 'Unknown Club' };
          });

        setAvailableClubs(uniqueClubs);
        setRequests(enrichedRequests);
        setFilteredRequests(enrichedRequests);
      } catch (error) {
        console.error('Error fetching join requests:', error);
        toast.error('Failed to load join requests');
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

  // Apply sorting and filtering
  useEffect(() => {
    if (requests.length === 0) return;

    let result = [...requests];

    // Apply club filter
    if (filterClub !== 'all') {
      result = result.filter(req => req.club_id === filterClub);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(req =>
        (req.username?.toLowerCase().includes(query)) ||
        (req.club_name?.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        comparison = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      } else if (sortField === 'username') {
        comparison = (a.username || '').localeCompare(b.username || '');
      } else if (sortField === 'club_name') {
        comparison = (a.club_name || '').localeCompare(b.club_name || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredRequests(result);
  }, [requests, sortField, sortOrder, filterClub, searchQuery]);

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
    } catch (error) {
      console.error('Error handling join request:', error);
      toast.error(`Failed to ${approve ? 'approve' : 'reject'} request. Please try again.`);
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

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Get request key
  const getRequestKey = (userId: string, clubId: string) => `${userId}-${clubId}`;

  return (
    <div>
      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">Join Requests</h1>

      {/* Sorting and Filtering Controls */}
      {requests.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by username or club..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Club Filter */}
            <div className="w-full md:w-64">
              <Select
                value={filterClub}
                onValueChange={setFilterClub}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by club" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  {availableClubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <div className="flex gap-1">
              <Button
                variant={sortField === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortField('date')}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Date
              </Button>
              <Button
                variant={sortField === 'username' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortField('username')}
                className="text-xs"
              >
                User
              </Button>
              <Button
                variant={sortField === 'club_name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortField('club_name')}
                className="text-xs"
              >
                Club
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSortOrder}
              className="ml-2"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const requestKey = getRequestKey(request.user_id, request.club_id);
            const isProcessing = processingRequests[requestKey];

            return (
              <Card key={requestKey}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserAvatar userId={request.user_id} size="sm" />
                        <h3 className="text-lg font-semibold">
                          <UserName userId={request.user_id} linkToProfile /> wants to join {request.club_name || 'a club'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Requested {format(new Date(request.joined_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequest(request.user_id, request.club_id, false)}
                        disabled={isProcessing}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        {isProcessing ? 'Processing...' : 'Deny'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequest(request.user_id, request.club_id, true)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : requests.length > 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No requests match your filters.
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterClub('all');
                    setSortField('date');
                    setSortOrder('desc');
                  }}
                >
                  Clear filters
                </Button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-muted-foreground">No pending join requests</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminJoinRequestsPage;
