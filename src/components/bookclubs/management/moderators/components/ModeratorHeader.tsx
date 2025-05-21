import React from 'react';
import { Shield, UserPlus } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ModeratorHeaderProps {
  onAddModerator: () => void;
}

/**
 * Header component for the moderator management panel
 */
const ModeratorHeader: React.FC<ModeratorHeaderProps> = ({ onAddModerator }) => {
  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderator Management
          </CardTitle>
          <CardDescription>
            Appoint and manage club moderators.
          </CardDescription>
        </div>
        <Button onClick={onAddModerator}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Moderator
        </Button>
      </div>
    </CardHeader>
  );
};

export default ModeratorHeader;
