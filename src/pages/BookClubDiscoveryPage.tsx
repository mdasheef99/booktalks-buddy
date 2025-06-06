import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useClubDiscovery, BookClub } from '@/components/bookclubs/hooks/useClubDiscovery';
import SearchAndFilterBar from '@/components/bookclubs/SearchAndFilterBar';
import ClubList from '@/components/bookclubs/ClubList';

const BookClubDiscoveryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use our custom hook for club discovery logic
  const {
    clubs,
    loading,
    totalCount,
    currentPage,
    searchQuery,
    setSearchQuery,
    privacyFilter,
    setPrivacyFilter,
    fetchClubs,
    handleJoinClub,
    handleCancelRequest,
    actionInProgress,
    pageSize
  } = useClubDiscovery({
    userId: user?.id,
    pageSize: 10
  });

  // Handle view club - memoized to prevent unnecessary re-renders
  const handleViewClub = useCallback((clubId: string) => {
    navigate(`/book-club/${clubId}`);
  }, [navigate]);

  // Render action button based on club status - memoized to prevent unnecessary re-renders
  const renderActionButton = useCallback((club: BookClub) => {
    const isLoading = actionInProgress === club.id;

    if (club.user_status === 'member' || club.user_status === 'admin') {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleViewClub(club.id);
          }}
          variant="outline"
        >
          View Club
        </Button>
      );
    }

    if (club.user_status === 'pending') {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleCancelRequest(club.id);
          }}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Request'}
        </Button>
      );
    }

    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleJoinClub(club.id);
        }}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : club.privacy === 'public' ? 'Join Club' : 'Request to Join'}
      </Button>
    );
  }, [actionInProgress, handleViewClub, handleCancelRequest, handleJoinClub]);

  // Handle search
  const handleSearch = useCallback(() => {
    fetchClubs(1);
  }, [fetchClubs]);

  // If user is not logged in, show login prompt
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
          {/* Header */}
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
          <SearchAndFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            privacyFilter={privacyFilter}
            onPrivacyFilterChange={setPrivacyFilter}
          />

          {/* Club List */}
          <ClubList
            clubs={clubs}
            loading={loading}
            searchQuery={searchQuery}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            renderActionButton={renderActionButton}
            onViewClub={handleViewClub}
            onPageChange={fetchClubs}
            actionInProgress={actionInProgress}
            onJoinClub={handleJoinClub}
            onCancelRequest={handleCancelRequest}
          />
        </div>
      </div>
    </div>
  );
};

export default BookClubDiscoveryPage;
