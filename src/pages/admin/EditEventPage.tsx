import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getEvent } from '@/lib/api/bookclubs/events';
import EventForm from '@/components/admin/events/EventForm';
import EventParticipantsList from '@/components/admin/events/EventParticipantsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { handleError, ErrorType, createStandardError } from '@/lib/utils/error-handling';

/**
 * Edit Event Page Component
 * Allows store owners/managers to edit existing events and manage participants
 */
const EditEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'participants' ? 'participants' : 'details';
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        // Create a standard error for missing event ID
        const standardError = createStandardError(
          ErrorType.VALIDATION,
          'Event ID is missing',
          'Unable to edit event without an ID. Redirecting to events list.',
          undefined,
          () => navigate('/admin/events')
        );

        // Handle the error (logs and shows toast)
        handleError(standardError, 'EditEventPage.fetchEvent');

        // Navigate back to events list
        navigate('/admin/events');
        return;
      }

      try {
        setLoading(true);
        const fetchedEvent = await getEvent(eventId);

        // Get participant count
        try {
          const { getEventParticipantCounts } = await import('@/lib/api/bookclubs/participants');
          const counts = await getEventParticipantCounts(eventId);
          const total = (counts.going || 0) + (counts.maybe || 0) + (counts.not_going || 0);

          // Add participant count to event object
          fetchedEvent.participant_count = total;
        } catch (countError) {
          console.warn('Failed to fetch participant counts:', countError);
          fetchedEvent.participant_count = 0;
        }

        setEvent(fetchedEvent);
      } catch (error) {
        // Create a standard error with navigation as recovery action
        const standardError = createStandardError(
          ErrorType.FETCH,
          'Failed to load event details',
          'Unable to retrieve the event information. Redirecting to events list.',
          error instanceof Error ? error : undefined,
          () => navigate('/admin/events')
        );

        // Handle the error (logs and shows toast)
        handleError(standardError, 'EditEventPage.fetchEvent');

        // Navigate back to events list
        navigate('/admin/events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/events')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>

        <Skeleton className="h-10 w-64 mb-8" />

        <Tabs defaultValue={initialTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="details">
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
            <TabsTrigger value="participants">
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Skeleton className="h-[600px] w-full" />
          </TabsContent>

          <TabsContent value="participants">
            <Skeleton className="h-[400px] w-full" />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/events')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">Edit Event: {event?.title}</h1>

      <Tabs defaultValue={initialTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Event Details</TabsTrigger>
          <TabsTrigger value="participants">
            Participants
            {event?.participant_count > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-800 text-xs rounded-full px-1.5 py-0.5">
                {event.participant_count}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <EventForm event={event} isEditing={true} />
        </TabsContent>

        <TabsContent value="participants">
          <EventParticipantsList eventId={eventId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditEventPage;
