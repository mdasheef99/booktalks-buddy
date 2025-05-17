import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, X, HelpCircle } from 'lucide-react';
import { rsvpToEvent, cancelRsvp, getUserRsvpStatus } from '@/lib/api/bookclubs/participants';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface RsvpButtonProps {
  eventId: string;
  className?: string;
}

type RsvpStatus = 'going' | 'maybe' | 'not_going';

/**
 * Button component for RSVPing to an event
 */
const RsvpButton: React.FC<RsvpButtonProps> = ({ eventId, className = '' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the user's current RSVP status
  const { data: rsvpData, isLoading } = useQuery({
    queryKey: ['event-rsvp', eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getUserRsvpStatus(user.id, eventId);
    },
    enabled: !!user?.id && !!eventId
  });

  const currentStatus = rsvpData?.rsvp_status as RsvpStatus | undefined;

  // Handle RSVP selection
  const handleRsvp = async (status: RsvpStatus) => {
    if (!user?.id) {
      toast.error('You must be logged in to RSVP');
      return;
    }

    try {
      setIsSubmitting(true);
      await rsvpToEvent(user.id, eventId, status);
      
      // Invalidate the query to refetch the RSVP status
      queryClient.invalidateQueries({ queryKey: ['event-rsvp', eventId, user.id] });
      queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
      
      toast.success(`You are ${status === 'going' ? 'going to' : status === 'maybe' ? 'maybe going to' : 'not going to'} this event`);
    } catch (error) {
      console.error('Error RSVPing to event:', error);
      toast.error('Failed to RSVP to event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling RSVP
  const handleCancelRsvp = async () => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      await cancelRsvp(user.id, eventId);
      
      // Invalidate the query to refetch the RSVP status
      queryClient.invalidateQueries({ queryKey: ['event-rsvp', eventId, user.id] });
      queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
      
      toast.success('RSVP canceled');
    } catch (error) {
      console.error('Error canceling RSVP:', error);
      toast.error('Failed to cancel RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not logged in, show a disabled button
  if (!user) {
    return (
      <Button disabled className={className}>
        Log in to RSVP
      </Button>
    );
  }

  // If loading, show a loading state
  if (isLoading) {
    return (
      <Button disabled className={className}>
        Loading...
      </Button>
    );
  }

  // If user has already RSVPed, show their status and option to cancel
  if (currentStatus) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant={
            currentStatus === 'going'
              ? 'default'
              : currentStatus === 'maybe'
                ? 'secondary'
                : 'outline'
          }
          disabled={isSubmitting}
          className="flex-1"
        >
          {currentStatus === 'going' ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Going
            </>
          ) : currentStatus === 'maybe' ? (
            <>
              <HelpCircle className="mr-2 h-4 w-4" />
              Maybe
            </>
          ) : (
            <>
              <X className="mr-2 h-4 w-4" />
              Not Going
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleCancelRsvp}
          disabled={isSubmitting}
        >
          Cancel RSVP
        </Button>
      </div>
    );
  }

  // If user hasn't RSVPed yet, show the dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className} disabled={isSubmitting}>
          RSVP to Event
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleRsvp('going')}>
          <Check className="mr-2 h-4 w-4" />
          Going
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRsvp('maybe')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Maybe
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRsvp('not_going')}>
          <X className="mr-2 h-4 w-4" />
          Not Going
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RsvpButton;
