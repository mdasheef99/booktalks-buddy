import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createEvent, updateEvent, Event } from '@/lib/api/bookclubs/events';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

// Import form section components
import BasicInfoSection from './form-sections/BasicInfoSection';
import DateTimeSection from './form-sections/DateTimeSection';
import LocationSection from './form-sections/LocationSection';
import AdditionalSettingsSection from './form-sections/AdditionalSettingsSection';

interface EventFormProps {
  event?: Event;
  isEditing?: boolean;
}

// Event type options
const EVENT_TYPES = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'author_meet', label: 'Author Meet' },
  { value: 'book_signing', label: 'Book Signing' },
  { value: 'festival', label: 'Festival' },
  { value: 'reading_marathon', label: 'Reading Marathon' },
  { value: 'book_swap', label: 'Book Swap' },
];

const EventForm: React.FC<EventFormProps> = ({ event, isEditing = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookClubs, setBookClubs] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventType, setEventType] = useState(event?.event_type || '');
  const [clubId, setClubId] = useState(event?.club_id || '');
  const [startDate, setStartDate] = useState(
    event?.start_time
      ? new Date(event.start_time).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    event?.start_time
      ? new Date(event.start_time).toISOString().split('T')[1].substring(0, 5)
      : '18:00'
  );
  const [endDate, setEndDate] = useState(
    event?.end_time
      ? new Date(event.end_time).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [endTime, setEndTime] = useState(
    event?.end_time
      ? new Date(event.end_time).toISOString().split('T')[1].substring(0, 5)
      : '20:00'
  );
  const [location, setLocation] = useState(event?.location || '');
  const [isVirtual, setIsVirtual] = useState(event?.is_virtual || false);
  const [virtualMeetingLink, setVirtualMeetingLink] = useState(event?.virtual_meeting_link || '');
  const [maxParticipants, setMaxParticipants] = useState(event?.max_participants?.toString() || '');
  const [featuredOnLanding, setFeaturedOnLanding] = useState(event?.featured_on_landing || false);

  // Fetch book clubs
  useEffect(() => {
    const fetchBookClubs = async () => {
      try {
        const { data, error } = await supabase
          .from('book_clubs')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setBookClubs(data || []);
      } catch (error) {
        console.error('Error fetching book clubs:', error);
        toast.error('Failed to load book clubs');
      }
    };

    fetchBookClubs();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in to create or edit events');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for the event');
      return;
    }

    // Validate dates
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime < startDateTime) {
      toast.error('End time cannot be before start time');
      return;
    }

    setLoading(true);

    try {
      // Use the actual store ID where the user is an administrator
      // This store ID is from the store_administrators table where the user is listed as an owner
      const storeId = 'ce76b99a-5f1a-481a-af85-862e584465e1';

      const eventData: any = {
        title: title.trim(),
        description: description.trim(),
        event_type: eventType || null,
        club_id: clubId === 'none' ? null : clubId || null,
        date: startDateTime.toISOString().split('T')[0], // Required field
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: location.trim() || null,
        is_virtual: isVirtual,
        virtual_meeting_link: isVirtual ? virtualMeetingLink.trim() : null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        featured_on_landing: featuredOnLanding,
      };

      if (isEditing && event) {
        await updateEvent(user.id, event.id, eventData);
        toast.success('Event updated successfully');
      } else {
        await createEvent(user.id, storeId, eventData);
        toast.success('Event created successfully');
      }

      // Navigate back to events list
      navigate('/admin/events');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update the details of your event'
              : 'Fill in the details to create a new event'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <BasicInfoSection
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            eventType={eventType}
            setEventType={setEventType}
            clubId={clubId}
            setClubId={setClubId}
            bookClubs={bookClubs}
            eventTypes={EVENT_TYPES}
          />

          {/* Date and Time */}
          <DateTimeSection
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endDate={endDate}
            setEndDate={setEndDate}
            endTime={endTime}
            setEndTime={setEndTime}
          />

          {/* Location */}
          <LocationSection
            isVirtual={isVirtual}
            setIsVirtual={setIsVirtual}
            location={location}
            setLocation={setLocation}
            virtualMeetingLink={virtualMeetingLink}
            setVirtualMeetingLink={setVirtualMeetingLink}
          />

          {/* Additional Settings */}
          <AdditionalSettingsSection
            maxParticipants={maxParticipants}
            setMaxParticipants={setMaxParticipants}
            featuredOnLanding={featuredOnLanding}
            setFeaturedOnLanding={setFeaturedOnLanding}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/events')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default EventForm;
