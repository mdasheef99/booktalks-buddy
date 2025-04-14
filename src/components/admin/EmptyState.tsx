import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-requests' | 'no-matches';
  onClearFilters?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onClearFilters }) => {
  if (type === 'no-requests') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-muted-foreground">No pending join requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className="text-muted-foreground">
          No requests match your filters.
          <Button
            variant="link"
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
