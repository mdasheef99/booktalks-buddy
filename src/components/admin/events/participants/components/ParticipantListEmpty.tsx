import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, RefreshCw } from 'lucide-react';
import { ParticipantListEmptyProps } from '../types';

/**
 * Empty state component for the participant list
 */
const ParticipantListEmpty: React.FC<ParticipantListEmptyProps> = ({
  loading,
  event,
  handleRefresh
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Participants</CardTitle>
        <CardDescription>
          {loading.event ? (
            <Skeleton className="h-4 w-60" />
          ) : (
            <>
              {event ? `No participants have RSVPed to ${event.title}` : 'No participants have RSVPed to this event yet'}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-6">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-500">
          When people RSVP to this event, they will appear here
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-center">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ParticipantListEmpty;
