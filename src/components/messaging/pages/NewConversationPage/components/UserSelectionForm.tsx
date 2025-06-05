/**
 * User Selection Form Component
 * 
 * Handles username input and user selection with autocomplete
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { UsernameAutocomplete } from '../../../components/UsernameAutocomplete';
import { formatUserDisplayName } from '../utils/conversationUtils';
import type { UserSelectionFormProps } from '../types';

/**
 * User Selection Form Component
 */
export const UserSelectionForm: React.FC<UserSelectionFormProps> = ({
  username,
  selectedUser,
  isLoading,
  canInitiate,
  onUsernameChange,
  onUserSelect,
  onClearSelection
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <div>
          <UsernameAutocomplete
            value={username}
            onChange={onUsernameChange}
            onSelect={onUserSelect}
            placeholder="Start typing a username..."
            disabled={!canInitiate || isLoading}
            className="w-full"
          />
        </div>

        {/* Selected user display */}
        {selectedUser && (
          <SelectedUserDisplay
            user={selectedUser}
            onClearSelection={onClearSelection}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Selected User Display Component
 */
interface SelectedUserDisplayProps {
  user: NonNullable<UserSelectionFormProps['selectedUser']>;
  onClearSelection: () => void;
}

const SelectedUserDisplay: React.FC<SelectedUserDisplayProps> = ({
  user,
  onClearSelection
}) => {
  const displayName = formatUserDisplayName(user.username, user.displayname);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-bookconnect-sage/20 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-bookconnect-sage" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">
              {displayName.primary}
            </p>
            {displayName.secondary && (
              <p className="text-xs text-green-600">
                {displayName.secondary}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="text-xs"
        >
          Change User
        </Button>
      </div>
    </div>
  );
};
