/**
 * Events List Component
 *
 * Displays a list of club meetings with actions for editing and deleting.
 */

import React, { useState } from 'react';
import { Calendar, Clock, Users, Video, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ClubMeeting, UpdateMeetingRequest } from '@/lib/services/clubManagementService';
import EventDetailsModal from './EventDetailsModal';
import EventEditModal from './EventEditModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import RSVPStats from './RSVPStats';

// =====================================================
// Types
// =====================================================

interface EventsListProps {
  events: ClubMeeting[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onEventUpdate: (meetingId: string, updates: UpdateMeetingRequest) => Promise<ClubMeeting>;
  onEventDelete: (meetingId: string) => Promise<void>;
  clubId: string;
  emptyMessage?: string;
  emptyDescription?: string;
}

// =====================================================
// Events List Component
// =====================================================

const EventsList: React.FC<EventsListProps> = ({
  events,
  loading,
  error,
  onRefresh,
  onEventUpdate,
  onEventDelete,
  clubId,
  emptyMessage = "No events found",
  emptyDescription = "Events will appear here when created"
}) => {
  const [selectedEvent, setSelectedEvent] = useState<ClubMeeting | null>(null);
  const [editingEvent, setEditingEvent] = useState<ClubMeeting | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<ClubMeeting | null>(null);

  // Helper function to get meeting type badge
  const getMeetingTypeBadge = (type: string) => {
    const badges = {
      discussion: { label: 'Discussion', className: 'bg-blue-100 text-blue-800' },
      social: { label: 'Social', className: 'bg-green-100 text-green-800' },
      planning: { label: 'Planning', className: 'bg-purple-100 text-purple-800' },
      author_event: { label: 'Author Event', className: 'bg-amber-100 text-amber-800' },
      other: { label: 'Other', className: 'bg-gray-100 text-gray-800' }
    };

    const badge = badges[type as keyof typeof badges] || badges.other;
    return (
      <Badge className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  // Helper function to format date and time
  const formatEventDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const isEventPast = isPast(date);

    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'h:mm a'),
      relative: formatDistanceToNow(date, { addSuffix: true }),
      isPast: isEventPast
    };
  };

  // Handle event actions
  const handleViewEvent = (event: ClubMeeting) => {
    setSelectedEvent(event);
  };

  const handleEditEvent = (event: ClubMeeting) => {
    setEditingEvent(event);
  };

  const handleDeleteEvent = (event: ClubMeeting) => {
    setDeletingEvent(event);
  };

  const handleEventUpdated = async (updates: UpdateMeetingRequest) => {
    if (!editingEvent) return;

    try {
      await onEventUpdate(editingEvent.id, updates);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      // Error handling is done in the parent component
    }
  };

  const handleEventDeleted = async () => {
    if (!deletingEvent) return;

    try {
      await onEventDelete(deletingEvent.id);
      setDeletingEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      // Error handling is done in the parent component
    }
  };

  // Loading state
  if (loading && events.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
        <p className="text-gray-600 mb-4">{emptyDescription}</p>
        {error && (
          <Button onClick={onRefresh} variant="outline">
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {events.map((event) => {
          const dateTime = formatEventDateTime(event.scheduled_at);

          return (
            <Card
              key={event.id}
              className={`transition-all duration-200 hover:shadow-md ${
                dateTime.isPast ? 'opacity-75' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Title and Type */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      {getMeetingTypeBadge(event.meeting_type)}
                    </div>

                    {/* Event Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{dateTime.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{dateTime.time} ({event.duration_minutes}m)</span>
                      </div>
                      {event.max_attendees && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Max {event.max_attendees}</span>
                        </div>
                      )}
                      {event.virtual_link && (
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          <span>Virtual</span>
                        </div>
                      )}
                    </div>

                    {/* Relative Time */}
                    <div className="text-sm">
                      <span className={`font-medium ${
                        dateTime.isPast ? 'text-gray-500' : 'text-bookconnect-terracotta'
                      }`}>
                        {dateTime.relative}
                      </span>
                      {event.creator_username && (
                        <span className="text-gray-500 ml-2">
                          • Created by {event.creator_username}
                        </span>
                      )}
                    </div>

                    {/* RSVP Statistics for Club Management */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <RSVPStats
                        meetingId={event.id}
                        clubId={clubId}
                        isMember={true} // Club managers are always members
                        compact={true}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewEvent(event)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Meeting
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteEvent(event)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Meeting
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        clubId={clubId}
      />

      <EventEditModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onEventUpdated={handleEventUpdated}
        clubId={clubId}
      />

      <DeleteConfirmationModal
        event={deletingEvent}
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleEventDeleted}
      />
    </>
  );
};

export default EventsList;
