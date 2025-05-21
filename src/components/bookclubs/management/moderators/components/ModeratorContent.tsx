import React from 'react';
import { UserPlus } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import EmptyState from '../../shared/EmptyState';
import ModeratorsTable from '../ModeratorsTable';
import { Moderator } from '../types';

interface ModeratorContentProps {
  moderators: Moderator[];
  hasMembersToAppoint: boolean;
  currentUserId?: string;
  processingAction: boolean;
  onAddModerator: () => void;
  onRemoveModerator: (moderatorId: string) => void;
}

/**
 * Content component for the moderator management panel
 */
const ModeratorContent: React.FC<ModeratorContentProps> = ({
  moderators,
  hasMembersToAppoint,
  currentUserId,
  processingAction,
  onAddModerator,
  onRemoveModerator
}) => {
  return (
    <CardContent>
      {moderators.length > 0 ? (
        <ModeratorsTable
          moderators={moderators}
          currentUserId={currentUserId}
          processingAction={processingAction}
          onRemoveModerator={onRemoveModerator}
        />
      ) : (
        <EmptyState
          title="No moderators appointed yet"
          description={hasMembersToAppoint
            ? "Any current member of the club can be upgraded to become a moderator. Moderators can help manage club content and discussions."
            : "Your club needs members before you can appoint moderators. Invite some members to get started."}
          icon={UserPlus}
          actionLabel={hasMembersToAppoint ? "Appoint First Moderator" : undefined}
          onAction={hasMembersToAppoint ? onAddModerator : undefined}
          variant={hasMembersToAppoint ? "default" : "warning"}
        />
      )}
    </CardContent>
  );
};

export default ModeratorContent;
