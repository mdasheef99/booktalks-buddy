import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/lib/api/bookclubs/events/types';
import { createEvent, updateEvent } from '@/lib/api/bookclubs/events/core';
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
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

// Import form section components
import BasicInfoSection from '@/components/admin/events/form-sections/BasicInfoSection';
import DateTimeSection from '@/components/admin/events/form-sections/DateTimeSection';
import LocationSection from '@/components/admin/events/form-sections/LocationSection';
import AdditionalSettingsSection from '@/components/admin/events/form-sections/AdditionalSettingsSection';
import ImageSection from '@/components/admin/events/form-sections/ImageSection';
import TempImageSection from '@/components/admin/events/form-sections/TempImageSection';

interface StoreManagerEventFormProps {
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

const StoreManagerEventForm: React.FC<StoreManagerEventFormProps> = ({ event, isEditing = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStoreManager, storeId, storeName, loading: storeAccessLoading } = useStoreManagerAccess();
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

  // Image state
  const [imageUrl, setImageUrl] = useState(event?.image_url || null);
  const [thumbnailUrl, setThumbnailUrl] = useState(event?.thumbnail_url || null);
  const [mediumUrl, setMediumUrl] = useState(event?.medium_url || null);
  const [imageAltText, setImageAltText] = useState(event?.image_alt_text || null);

  // Temporary image file for new events
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);

  // Fetch book clubs for the store
  useEffect(() => {
    const fetchBookClubs = async () => {
      if (!storeId) return;

      try {
        // Fetch only book clubs belonging to this store
        const { data, error } = await supabase
          .from('book_clubs')
          .select('id, name')
          .eq('store_id', storeId)
          .order('name');

        if (error) throw error;
        setBookClubs(data || []);
      } catch (error) {
        console.error('Error fetching book clubs:', error);
        toast.error('Failed to load book clubs');
      }
    };

    fetchBookClubs();
  }, [storeId]);

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
            You don't have Store Manager access to manage events.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in to create or edit events');
      return;
    }

    if (!storeId) {
      toast.error('Store context is required to manage events');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for the event');
      return;
    }

    // Enhanced date validation
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const now = new Date();

    // Check if start time is in the past
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    if (startDateTime <= fifteenMinutesFromNow) {
      toast.error('Event start time must be at least 15 minutes in the future');
      return;
    }

    // Check if end time is before start time
    if (endDateTime <= startDateTime) {
      toast.error('Event end time must be after start time');
      return;
    }

    // Check minimum duration (15 minutes)
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    if (durationMinutes < 15) {
      toast.error('Event duration must be at least 15 minutes');
      return;
    }

    // Check if event is too far in the future (1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (startDateTime > oneYearFromNow) {
      toast.error('Event cannot be scheduled more than 1 year in advance');
      return;
    }

    setLoading(true);

    try {
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
        // Include image data
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        medium_url: mediumUrl,
        image_alt_text: imageAltText,
      };

      if (isEditing && event) {
        await updateEvent(user.id, event.id, eventData);
        toast.success('Event updated successfully');

        // Navigate back to events list
        navigate('/store-manager/events');
      } else {
        // Create the event with Store Manager's store ID
        const newEvent = await createEvent(user.id, storeId, eventData);

        // If we have a temporary image file, upload it
        if (tempImageFile && newEvent?.id) {
          try {
            toast.info('Uploading event image...');

            // Upload the image
            const { uploadEventImage } = await import('@/lib/api/bookclubs/events/images');
            await uploadEventImage(
              user.id,
              newEvent.id,
              tempImageFile,
              tempImageFile.name
            );

            toast.success('Event and image created successfully');
          } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Event created but image upload failed: ' + (error.message || 'Unknown error'));
          }
        } else {
          toast.success('Event created successfully');
        }

        // Navigate back to events list
        navigate('/store-manager/events');
      }
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
              : `Fill in the details to create a new event for ${storeName || 'your store'}`}
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

          {/* Event Image */}
          {isEditing && event ? (
            <ImageSection
              eventId={event.id}
              imageUrl={imageUrl}
              thumbnailUrl={thumbnailUrl}
              imageAltText={imageAltText}
              onImageUploaded={(imageUrl, thumbnailUrl, mediumUrl) => {
                setImageUrl(imageUrl);
                setThumbnailUrl(thumbnailUrl);
                setMediumUrl(mediumUrl);
              }}
              onImageRemoved={() => {
                setImageUrl(null);
                setThumbnailUrl(null);
                setMediumUrl(null);
                setImageAltText(null);
              }}
            />
          ) : (
            <TempImageSection
              selectedFile={tempImageFile}
              onImageSelected={(file) => setTempImageFile(file)}
              onImageRemoved={() => setTempImageFile(null)}
            />
          )}

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
            onClick={() => navigate('/store-manager/events')}
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

export default StoreManagerEventForm;
