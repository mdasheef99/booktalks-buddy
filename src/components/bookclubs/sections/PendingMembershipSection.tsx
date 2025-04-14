import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PendingMembershipSectionProps {
  actionInProgress: boolean;
  handleCancelRequest: () => Promise<void>;
}

const PendingMembershipSection: React.FC<PendingMembershipSectionProps> = ({
  actionInProgress,
  handleCancelRequest
}) => {
  return (
    <Card className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-2">Membership Pending</h2>
      <p className="text-gray-600 mb-4">
        Your request to join this club is pending approval from an admin.
      </p>
      <Button
        variant="outline"
        onClick={handleCancelRequest}
        disabled={actionInProgress}
      >
        {actionInProgress ? 'Cancelling...' : 'Cancel Request'}
      </Button>
    </Card>
  );
};

export default PendingMembershipSection;
