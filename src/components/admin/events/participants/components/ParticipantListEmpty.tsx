import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
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
        <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2 text-gray-700">No Participants Yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          When people RSVP to this event, they will appear here. You can share the event link to encourage more participants.
        </p>

        {event && event.start_time && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md inline-block">
            <p className="text-sm text-blue-700">
              Event scheduled for: <span className="font-medium">{new Date(event.start_time).toLocaleString()}</span>
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-1"
          aria-label="Refresh participant list"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>

        {event && (
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              // Copy event link to clipboard
              const eventLink = `${window.location.origin}/events/${event.id}`;
              navigator.clipboard.writeText(eventLink);
              toast.success('Event link copied to clipboard', {
                description: 'Share this link to invite participants to your event.'
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Copy Event Link</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ParticipantListEmpty;
