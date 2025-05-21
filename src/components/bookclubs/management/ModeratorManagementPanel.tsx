import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './shared/LoadingSpinner';

// Import custom hooks
import useModerators from './moderators/hooks/useModerators';
import useEligibleMembers from './moderators/hooks/useEligibleMembers';
import useModeratorSearch from './moderators/hooks/useModeratorSearch';

// Import components
import ModeratorHeader from './moderators/components/ModeratorHeader';
import ModeratorContent from './moderators/components/ModeratorContent';
import AddModeratorDialog from './moderators/AddModeratorDialog';
import RemoveModeratorDialog from './moderators/RemoveModeratorDialog';
import { ModeratorManagementPanelProps } from './moderators/types';

/**
 * Moderator Management Panel Component
 *
 * This component allows club leads to appoint and remove moderators.
 */
const ModeratorManagementPanel: React.FC<ModeratorManagementPanelProps> = ({ clubId }) => {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [moderatorToRemove, setModeratorToRemove] = useState<string | null>(null);

  // Use custom hooks
  const {
    moderators,
    loading: moderatorsLoading,
    processingAction,
    appointModerator,
    removeModerator
  } = useModerators(clubId, user?.id);

  const moderatorIds = moderators.map(mod => mod.user_id);

  const {
    members,
    loading: membersLoading
  } = useEligibleMembers(clubId, user?.id, moderatorIds);

  const {
    searchQuery,
    setSearchQuery,
    filteredMembers
  } = useModeratorSearch(members);

  // Handle moderator appointment
  const handleAppointModerator = async (memberId: string) => {
    const success = await appointModerator(memberId);
    if (success) {
      setShowAddDialog(false);
    }
  };

  // Handle moderator removal
  const handleRemoveModerator = async (moderatorId: string) => {
    const success = await removeModerator(moderatorId);
    if (success) {
      setModeratorToRemove(null);
    }
  };

  // Show loading spinner while data is being fetched
  if (moderatorsLoading || membersLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card>
        <ModeratorHeader onAddModerator={() => setShowAddDialog(true)} />
        <ModeratorContent
          moderators={moderators}
          hasMembersToAppoint={members.length > 0}
          currentUserId={user?.id}
          processingAction={processingAction}
          onAddModerator={() => setShowAddDialog(true)}
          onRemoveModerator={setModeratorToRemove}
        />
      </Card>

      {/* Add Moderator Dialog */}
      <AddModeratorDialog
        open={showAddDialog}
        members={members}
        filteredMembers={filteredMembers}
        searchQuery={searchQuery}
        processingAction={processingAction}
        onOpenChange={setShowAddDialog}
        onSearchChange={setSearchQuery}
        onAppointModerator={handleAppointModerator}
      />

      {/* Confirmation dialog for moderator removal */}
      <RemoveModeratorDialog
        moderatorId={moderatorToRemove}
        processingAction={processingAction}
        onOpenChange={(open) => !open && setModeratorToRemove(null)}
        onConfirm={handleRemoveModerator}
      />
    </>
  );
};

export default ModeratorManagementPanel;
