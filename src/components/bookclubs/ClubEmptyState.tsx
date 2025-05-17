import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClubEmptyStateProps {
  searchQuery?: string;
}

const ClubEmptyState: React.FC<ClubEmptyStateProps> = ({ searchQuery }) => {
  const navigate = useNavigate();

  return (
    <Card className="p-8 text-center">
      <h3 className="text-xl font-semibold mb-2">No clubs found</h3>
      <p className="text-gray-600 mb-6">
        {searchQuery
          ? `No clubs match your search for "${searchQuery}"`
          : 'There are no book clubs available at the moment'}
      </p>
      <Button onClick={() => navigate('/book-club/new')}>
        Create Your Own Club
      </Button>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ClubEmptyState);
