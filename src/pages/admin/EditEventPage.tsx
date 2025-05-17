import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getEvent } from '@/lib/api/bookclubs/events';
import EventForm from '@/components/admin/events/EventForm';
import EventParticipantsList from '@/components/admin/events/EventParticipantsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Edit Event Page Component
 * Allows store owners/managers to edit existing events and manage participants
 */
const EditEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        toast.error('Event ID is missing');
        navigate('/admin/events');
        return;
      }

      try {
        setLoading(true);
        const fetchedEvent = await getEvent(eventId);
        setEvent(fetchedEvent);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
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

        <Tabs defaultValue="details">
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

      <Tabs defaultValue="details">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Event Details</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
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
