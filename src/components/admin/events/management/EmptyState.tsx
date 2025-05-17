import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyStateProps } from './types';

/**
 * Component for displaying an empty state when no events are found
 */
const EmptyState: React.FC<EmptyStateProps> = ({ onCreateEvent }) => {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="pt-6 pb-6 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No events found</h3>
        <p className="text-sm text-gray-500 mb-4">
          There are no events matching your criteria.
        </p>
        <Button onClick={onCreateEvent}>
          Create New Event
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
