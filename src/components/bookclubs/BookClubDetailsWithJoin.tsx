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
import NominationsSection from './sections/NominationsSection';
import JoinClubSection from './sections/JoinClubSection';
import PendingMembershipSection from './sections/PendingMembershipSection';
import EventsSection from './sections/EventsSection';

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
    isAdmin, // Legacy admin check
    canManageClub, // New entitlements-based check
    canModerateClub, // New entitlements-based check
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
        setShowLeaveConfirm={setShowLeaveConfirm}
      />

      <div className="space-y-8">
        {/* Club Header */}
        <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 p-6 transition-all duration-300 hover:shadow-lg">
          <ClubHeader
            club={club}
            isMember={isMember}
            isPending={isPending}
            clubId={clubId || ''}
            actionInProgress={actionInProgress}
            handleJoinClub={handleJoinClub}
            handleCancelRequest={handleCancelRequest}
          />
        </div>

        {/* Current Book */}
        <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 p-6 transition-all duration-300 hover:shadow-lg">
          <CurrentBookSection currentBook={currentBook} />
        </div>

        {/* Book Nominations - Only show for members */}
        {isMember && (
          <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 p-6 transition-all duration-300 hover:shadow-lg">
            <NominationsSection
              clubId={clubId || ''}
              isMember={isMember}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* Club Events - Only show for members */}
        {isMember && (
          <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 transition-all duration-300 hover:shadow-lg">
            <EventsSection
              clubId={clubId || ''}
              isMember={isMember}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 p-6 transition-all duration-300 hover:shadow-lg">
          <MembersSection members={members} />
        </div>

        {/* Discussion Topics - Only show for members */}
        {isMember && (
          <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 p-6 transition-all duration-300 hover:shadow-lg">
            <DiscussionsSection topics={topics} clubId={clubId || ''} />
          </div>
        )}

        {/* Join message for non-members */}
        {!isMember && !isPending && (
          <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 p-6 transition-all duration-300 hover:shadow-lg">
            <JoinClubSection
              clubPrivacy={club.privacy || 'public'}
              actionInProgress={actionInProgress}
              handleJoinClub={handleJoinClub}
            />
          </div>
        )}

        {/* Pending message */}
        {isPending && (
          <div className="bg-white rounded-xl shadow-md border border-bookconnect-brown/10 p-6 transition-all duration-300 hover:shadow-lg">
            <PendingMembershipSection
              actionInProgress={actionInProgress}
              handleCancelRequest={handleCancelRequest}
            />
          </div>
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
