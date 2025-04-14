import React from 'react';
import { useParams } from 'react-router-dom';
import { useLoadProfiles } from '@/contexts/UserProfileContext';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';

// Import custom hooks
import useClubDetails from './hooks/useClubDetails';
import useClubMembership from './hooks/useClubMembership';

// Import UI components
import ClubHeader from './sections/ClubHeader';
import ClubNavigation from './sections/ClubNavigation';
import CurrentBookSection from './sections/CurrentBookSection';
import MembersSection from './sections/MembersSection';
import DiscussionsSection from './sections/DiscussionsSection';
import JoinClubSection from './sections/JoinClubSection';
import PendingMembershipSection from './sections/PendingMembershipSection';

interface BookClubDetailsWithJoinProps {}

export const BookClubDetailsWithJoin: React.FC<BookClubDetailsWithJoinProps> = () => {
  const { clubId } = useParams<{ clubId: string }>();

  // Use custom hooks for data fetching and membership management
  const {
    club,
    members,
    currentBook,
    topics,
    loading,
    isMember,
    isPending,
    isAdmin,
    fetchClubDetails
  } = useClubDetails(clubId);

  const {
    actionInProgress,
    showLeaveConfirm,
    setShowLeaveConfirm,
    handleJoinClub,
    handleCancelRequest,
    handleLeaveClub
  } = useClubMembership(clubId, club?.privacy, fetchClubDetails);

  // Load profiles for members
  useLoadProfiles(members, (member) => member.user_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300"></div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="text-center p-8">
        <p>Book club not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <ClubNavigation
        clubId={clubId || ''}
        isMember={isMember}
        isAdmin={isAdmin}
        setShowLeaveConfirm={setShowLeaveConfirm}
      />

      <div className="space-y-8">
        {/* Club Header */}
        <ClubHeader
          club={club}
          isAdmin={isAdmin}
          isMember={isMember}
          isPending={isPending}
          clubId={clubId || ''}
          actionInProgress={actionInProgress}
          handleJoinClub={handleJoinClub}
          handleCancelRequest={handleCancelRequest}
        />

        {/* Current Book */}
        <CurrentBookSection currentBook={currentBook} />

        {/* Members */}
        <MembersSection members={members} />

        {/* Discussion Topics - Only show for members */}
        {isMember && (
          <DiscussionsSection topics={topics} clubId={clubId || ''} />
        )}

        {/* Join message for non-members */}
        {!isMember && !isPending && (
          <JoinClubSection
            clubPrivacy={club.privacy || 'public'}
            actionInProgress={actionInProgress}
            handleJoinClub={handleJoinClub}
          />
        )}

        {/* Pending message */}
        {isPending && (
          <PendingMembershipSection
            actionInProgress={actionInProgress}
            handleCancelRequest={handleCancelRequest}
          />
        )}
      </div>

      {/* Leave Club Confirmation */}
      {showLeaveConfirm && (
        <ConfirmationDialog
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={handleLeaveClub}
          title="Leave Book Club"
          description="Are you sure you want to leave this book club? You will lose access to all discussions and will need to rejoin or be invited back."
          confirmText="Leave Club"
          variant="destructive"
          isLoading={actionInProgress}
        />
      )}
    </div>
  );
};

export default BookClubDetailsWithJoin;
