import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getEvent } from '@/lib/api/bookclubs/events';
import StoreManagerEventForm from '@/components/store-manager/events/StoreManagerEventForm';
import EventParticipantsList from '@/components/admin/events/EventParticipantsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { handleError, ErrorType, createStandardError } from '@/lib/utils/error-handling';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

/**
 * Store Manager Edit Event Page Component
 * Allows Store Managers to edit existing events and manage participants for their store
 */
const StoreManagerEditEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'participants' ? 'participants' : 'details';
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isStoreManager, storeId, storeName, loading: storeAccessLoading } = useStoreManagerAccess();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        // Create a standard error for missing event ID
        const standardError = createStandardError(
          ErrorType.VALIDATION,
          'Event ID is missing',
          'Unable to edit event without an ID. Redirecting to events list.',
          undefined,
          () => navigate('/store-manager/events')
        );

        // Handle the error (logs and shows toast)
        handleError(standardError, 'StoreManagerEditEventPage.fetchEvent');

        // Navigate back to events list
        navigate('/store-manager/events');
        return;
      }

      // Wait for store access to be determined
      if (storeAccessLoading) return;

      // Check store manager access
      if (!isStoreManager || !storeId) {
        navigate('/store-manager/events');
        return;
      }

      try {
        setLoading(true);
        const fetchedEvent = await getEvent(eventId);

        // Verify the event belongs to the Store Manager's store
        if (fetchedEvent.store_id !== storeId) {
          const standardError = createStandardError(
            ErrorType.PERMISSION,
            'Access denied to this event',
            'This event belongs to a different store. Redirecting to events list.',
            undefined,
            () => navigate('/store-manager/events')
          );

          handleError(standardError, 'StoreManagerEditEventPage.fetchEvent');
          navigate('/store-manager/events');
          return;
        }

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
          () => navigate('/store-manager/events')
        );

        // Handle the error (logs and shows toast)
        handleError(standardError, 'StoreManagerEditEventPage.fetchEvent');

        // Navigate back to events list
        navigate('/store-manager/events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate, isStoreManager, storeId, storeAccessLoading]);

  // Show loading state while checking store access
  if (storeAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-terracotta mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">
            Verifying Store Manager access...
          </p>
        </div>
      </div>
    );
  }

  // Show error if not a store manager
  if (!isStoreManager || !storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have Store Manager access to edit events.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/store-manager/events')}
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
        onClick={() => navigate('/store-manager/events')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-serif text-bookconnect-terracotta mb-2">
          Edit Event: {event?.title}
        </h1>
        <p className="text-gray-600">
          Edit event for {storeName || 'your store'}
        </p>
      </div>

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
          <StoreManagerEventForm event={event} isEditing={true} />
        </TabsContent>

        <TabsContent value="participants">
          <EventParticipantsList eventId={eventId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreManagerEditEventPage;
