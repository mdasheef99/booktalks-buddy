import React, { memo } from 'react';
import { BookClub } from './hooks/useClubDiscovery';
import DiscoveryBookClubCard from './DiscoveryBookClubCard';
import EnhancedDiscoveryBookClubCard from './EnhancedDiscoveryBookClubCard';
import ClubLoadingSkeleton from './ClubLoadingSkeleton';
import ClubEmptyState from './ClubEmptyState';
import ClubPagination from './ClubPagination';

interface ClubListProps {
  clubs: BookClub[];
  loading: boolean;
  searchQuery: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  renderActionButton: (club: BookClub) => React.ReactNode;
  onViewClub: (clubId: string) => void;
  onPageChange: (page: number) => void;
  actionInProgress?: string | null;
  onJoinClub?: (clubId: string) => void;
  onCancelRequest?: (clubId: string) => void;
}

const ClubList: React.FC<ClubListProps> = ({
  clubs,
  loading,
  searchQuery,
  totalCount,
  currentPage,
  pageSize,
  renderActionButton,
  onViewClub,
  onPageChange,
  actionInProgress,
  onJoinClub,
  onCancelRequest
}) => {
  if (loading) {
    return <ClubLoadingSkeleton count={3} />;
  }

  if (clubs.length === 0) {
    return <ClubEmptyState searchQuery={searchQuery} />;
  }

  return (
    <div className="space-y-4">
      {clubs.map((club) => {
        // TEMPORARY: Force enhanced cards for ALL private clubs to debug
        const useEnhancedCard = club.privacy === 'private';

        // Debug logging (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('ClubList - Club evaluation:', {
            clubId: club.id,
            clubName: club.name,
            privacy: club.privacy,
            join_questions_enabled: club.join_questions_enabled,
            actionInProgress: actionInProgress,
            hasOnJoinClub: !!onJoinClub,
            hasOnCancelRequest: !!onCancelRequest,
            useEnhancedCard
          });
        }

        if (useEnhancedCard) {
          return (
            <EnhancedDiscoveryBookClubCard
              key={club.id}
              club={club}
              renderActionButton={renderActionButton}
              onViewClub={onViewClub}
              actionInProgress={actionInProgress}
              onJoinClub={onJoinClub}
              onCancelRequest={onCancelRequest}
            />
          );
        }

        return (
          <DiscoveryBookClubCard
            key={club.id}
            club={club}
            renderActionButton={renderActionButton}
            onViewClub={onViewClub}
          />
        );
      })}

      <ClubPagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ClubList);
