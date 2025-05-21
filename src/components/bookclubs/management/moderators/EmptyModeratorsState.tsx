import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyModeratorsStateProps {
  hasMembersToAppoint: boolean;
  onAddModerator: () => void;
}

/**
 * Component displayed when no moderators exist
 */
const EmptyModeratorsState: React.FC<EmptyModeratorsStateProps> = ({
  hasMembersToAppoint,
  onAddModerator,
}) => {
  return (
    <div className="text-center p-8 border rounded-md">
      <p className="text-gray-500">No moderators appointed yet</p>
      <p className="text-sm text-gray-400 mt-2 mb-4">
        Any current member of the club can be upgraded to become a moderator.
        Moderators can help manage club content and discussions.
      </p>
      {hasMembersToAppoint ? (
        <Button
          className="mt-2"
          onClick={onAddModerator}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Appoint First Moderator
        </Button>
      ) : (
        <p className="text-sm text-amber-600 mt-2">
          Your club needs members before you can appoint moderators.
        </p>
      )}
    </div>
  );
};

export default EmptyModeratorsState;
