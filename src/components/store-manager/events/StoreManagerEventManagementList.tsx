import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Event } from '@/lib/api/bookclubs/events/types';
import { deleteEvent } from '@/lib/api/bookclubs/events/core';
import { toggleEventFeatured } from '@/lib/api/bookclubs/events/queries';
import { EventManagementListProps } from '@/components/admin/events/management/types';
import EventCard from '@/components/admin/events/management/EventCard';
import EmptyState from '@/components/admin/events/management/EmptyState';
import DeleteEventDialog from '@/components/admin/events/management/DeleteEventDialog';

/**
 * Store Manager Event Management List Component
 * Displays a grid of event cards with Store Manager-specific navigation
 */
const StoreManagerEventManagementList: React.FC<EventManagementListProps> = ({ events, onRefresh }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle view event - navigate to public event page
  const handleViewEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  // Handle edit event - navigate to Store Manager edit page
  const handleEditEvent = (eventId: string) => {
    navigate(`/store-manager/events/edit/${eventId}`);
  };

  // Handle create event - navigate to Store Manager create page
  const handleCreateEvent = () => {
    navigate('/store-manager/events/create');
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  // Handle delete event (called from card)
  const handleDeleteEvent = async (eventId: string) => {
    // Find the event to delete
    const event = events.find(e => e.id === eventId);
    if (event) {
      openDeleteDialog(event);
    }
  };

  // Confirm delete event (called from dialog)
  const confirmDeleteEvent = async (eventId: string) => {
    if (!user?.id || !eventId) return;

    setIsDeleting(true);

    try {
      await deleteEvent(user.id, eventId);
      toast.success('Event deleted successfully');

      // Refresh the events list
      onRefresh();

      // Close the dialog
      closeDeleteDialog();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      
      // Check if it's a permission error and provide helpful message
      if (error.message && error.message.includes('Unauthorized')) {
        toast.error('You do not have permission to delete this event');
      } else {
        toast.error('Failed to delete event');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (eventId: string, featured: boolean) => {
    if (!user?.id) return;

    try {
      await toggleEventFeatured(user.id, eventId, featured);
      toast.success(`Event ${featured ? 'featured' : 'unfeatured'} successfully`);

      // Refresh the events list
      onRefresh();
    } catch (error: any) {
      console.error('Error toggling event featured status:', error);
      
      // Check if it's a permission error and provide helpful message
      if (error.message && error.message.includes('Unauthorized')) {
        toast.error('You do not have permission to feature this event');
      } else {
        toast.error('Failed to update event featured status');
      }
    }
  };

  // If no events
  if (events.length === 0) {
    return <EmptyState onCreateEvent={handleCreateEvent} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onViewEvent={handleViewEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onToggleFeatured={handleToggleFeatured}
          />
        ))}
      </div>

      {/* Delete Event Confirmation Dialog */}
      {eventToDelete && (
        <DeleteEventDialog
          isOpen={deleteDialogOpen}
          eventId={eventToDelete.id}
          eventTitle={eventToDelete.title}
          event={eventToDelete}
          onClose={closeDeleteDialog}
          onConfirm={confirmDeleteEvent}
          isLoading={isDeleting}
        />
      )}
    </>
  );
};

export default StoreManagerEventManagementList;
