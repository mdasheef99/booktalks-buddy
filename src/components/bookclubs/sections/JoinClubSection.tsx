import React from 'react';
import { UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JoinClubSectionProps {
  clubPrivacy: string;
  actionInProgress: boolean;
  handleJoinClub: () => Promise<void>;
}

const JoinClubSection: React.FC<JoinClubSectionProps> = ({
  clubPrivacy,
  actionInProgress,
  handleJoinClub
}) => {
  return (
    <Card className="p-6 text-center">
      <UserPlus className="h-12 w-12 mx-auto text-bookconnect-terracotta mb-4" />
      <h2 className="text-xl font-semibold mb-2">Join this Book Club</h2>
      <p className="text-gray-600 mb-4">
        Join this book club to participate in discussions and connect with other readers.
      </p>
      <Button
        onClick={handleJoinClub}
        disabled={actionInProgress}
        className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
      >
        {actionInProgress ? 'Processing...' : clubPrivacy === 'public' ? 'Join Club' : 'Request to Join'}
      </Button>
    </Card>
  );
};

export default JoinClubSection;
