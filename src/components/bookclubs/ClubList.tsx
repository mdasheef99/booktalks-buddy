import React, { memo } from 'react';
import { BookClub } from './hooks/useClubDiscovery';
import DiscoveryBookClubCard from './DiscoveryBookClubCard';
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
  onPageChange
}) => {
  if (loading) {
    return <ClubLoadingSkeleton count={3} />;
  }

  if (clubs.length === 0) {
    return <ClubEmptyState searchQuery={searchQuery} />;
  }

  return (
    <div className="space-y-4">
      {clubs.map((club) => (
        <DiscoveryBookClubCard
          key={club.id}
          club={club}
          renderActionButton={renderActionButton}
          onViewClub={onViewClub}
        />
      ))}

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
