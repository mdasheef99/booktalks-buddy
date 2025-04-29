import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDiscoverableClubs, joinOrRequestClub, cancelJoinRequest } from '@/lib/api';

interface BookClub {
  id: string;
  name: string;
  description: string | null;
  privacy: string | null;
  created_at: string;
  user_status: string;
}

const BookClubDiscoveryPage: React.FC = () => {
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const pageSize = 10;

  // Fetch clubs with pagination and filters
  const fetchClubs = async (page: number = 1) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const { clubs: fetchedClubs, count } = await getDiscoverableClubs(user.id, {
        limit: pageSize,
        offset,
        filter: privacyFilter,
        search: searchQuery
      });

      setClubs(fetchedClubs);
      setTotalCount(count);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load book clubs');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchClubs(1);
    }
  }, [user?.id, privacyFilter]);

  // Handle search
  const handleSearch = () => {
    fetchClubs(1);
  };

  // Handle join/request
  const handleJoinClub = async (clubId: string) => {
    if (!user?.id) {
      toast.error('Please log in to join a club');
      return;
    }

    setActionInProgress(clubId);
    try {
      const result = await joinOrRequestClub(user.id, clubId);
      toast.success(result.message);

      // Update the local state to reflect the change
      setClubs(prevClubs =>
        prevClubs.map(club =>
          club.id === clubId
            ? { ...club, user_status: club.privacy === 'public' ? 'member' : 'pending' }
            : club
        )
      );
    } catch (error: any) {
      console.error('Error joining club:', error);
      // Display the specific error message from the API
      toast.error(error.message || 'Failed to join club. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle cancel request
  const handleCancelRequest = async (clubId: string) => {
    if (!user?.id) return;

    setActionInProgress(clubId);
    try {
      const result = await cancelJoinRequest(user.id, clubId);
      toast.success(result.message);

      // Update the local state to reflect the change
      setClubs(prevClubs =>
        prevClubs.map(club =>
          club.id === clubId ? { ...club, user_status: 'not-member' } : club
        )
      );
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      // Display the specific error message from the API
      toast.error(error.message || 'Failed to cancel request. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle view club
  const handleViewClub = (clubId: string) => {
    navigate(`/book-club/${clubId}`);
  };

  // Render join button based on club status
  const renderActionButton = (club: BookClub) => {
    const isLoading = actionInProgress === club.id;

    if (club.user_status === 'member' || club.user_status === 'admin') {
      return (
        <Button
          onClick={() => handleViewClub(club.id)}
          variant="outline"
        >
          View Club
        </Button>
      );
    }

    if (club.user_status === 'pending') {
      return (
        <Button
          onClick={() => handleCancelRequest(club.id)}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Request'}
        </Button>
      );
    }

    return (
      <Button
        onClick={() => handleJoinClub(club.id)}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : club.privacy === 'public' ? 'Join Club' : 'Request to Join'}
      </Button>
    );
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (!user) {
    return (
      <div className="min-h-screen bg-bookconnect-cream flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 rounded-lg shadow-lg border border-bookconnect-brown/20">
          <p className="font-serif text-bookconnect-brown mb-4">Please log in to discover book clubs</p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-bookconnect-brown text-white hover:bg-bookconnect-brown/90"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/book-club')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Clubs
            </Button>
            <h1 className="text-3xl font-serif text-bookconnect-brown">Discover Book Clubs</h1>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search clubs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select
                value={privacyFilter}
                onValueChange={(value) => setPrivacyFilter(value as 'all' | 'public' | 'private')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by privacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  <SelectItem value="public">Public Clubs</SelectItem>
                  <SelectItem value="private">Private Clubs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Club List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : clubs.length > 0 ? (
            <div className="space-y-4">
              {clubs.map((club) => (
                <Card key={club.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{club.name}</h3>
                      <p className="text-gray-600 mt-1">
                        {club.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          club.privacy === 'private'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {club.privacy || 'public'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {/* This would ideally show member count */}
                          Members
                        </span>
                      </div>
                    </div>

                    <div>
                      {renderActionButton(club)}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} clubs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchClubs(currentPage - 1)}
                      disabled={!canGoPrevious}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchClubs(currentPage + 1)}
                      disabled={!canGoNext}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No clubs found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? `No clubs match your search for "${searchQuery}"`
                  : 'There are no book clubs available at the moment'}
              </p>
              <Button onClick={() => navigate('/book-club/new')}>
                Create Your Own Club
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookClubDiscoveryPage;
