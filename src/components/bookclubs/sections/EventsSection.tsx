/**
 * Events Section for BookClubDetails
 *
 * Displays club events/meetings on the club details page
 * Integrates with the Phase 3 Events system
 */

import React, { useState } from 'react';
import { Calendar, Clock, Plus, Users, MapPin, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useClubEvents } from '@/hooks/clubManagement/useClubEvents';
import { ClubMeeting } from '@/lib/services/clubManagementService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement } from '@/lib/entitlements/hooks';
import EventCreationModal from '@/components/clubManagement/events/EventCreationModal';
import RSVPButtons from '@/components/clubManagement/events/RSVPButtons';
import RSVPStats from '@/components/clubManagement/events/RSVPStats';

interface EventsSectionProps {
  clubId: string;
  isMember: boolean;
  isAdmin: boolean;
  onCreateEvent?: () => void;
}

const EventsSection: React.FC<EventsSectionProps> = ({
  clubId,
  isMember,
  isAdmin,
  onCreateEvent
}) => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch upcoming events by default, all events if showAll is true
  const { meetings, loading, error, refresh } = useClubEvents(clubId, {
    upcoming: !showAll,
    limit: showAll ? 50 : 5
  });

  // Check if user can manage club events
  const { result: canManageClubEvents } = useHasEntitlement('CAN_MANAGE_CLUB_EVENTS');

  // Filter events based on what to show
  const eventsToShow = showAll ? meetings : meetings.slice(0, 3);
  const hasMoreEvents = meetings.length > 3;

  const handleCreateEvent = () => {
    if (onCreateEvent) {
      onCreateEvent();
    } else {
      setShowCreateModal(true);
    }
  };

  const handleEventCreated = (newEvent: ClubMeeting) => {
    // Refresh the events list
    refresh();
    setShowCreateModal(false);
  };

  const renderEventCard = (event: ClubMeeting) => {
    const eventDate = new Date(event.scheduled_at);
    const isEventPast = isPast(eventDate);
    const relativeTime = formatDistanceToNow(eventDate, { addSuffix: true });

    return (
      <Card
        key={event.id}
        className={`p-4 transition-all duration-200 hover:shadow-md ${
          isEventPast ? 'opacity-75' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-lg">{event.title}</h4>
              <Badge
                variant={isEventPast ? 'secondary' : 'default'}
                className="text-xs"
              >
                {event.meeting_type}
              </Badge>
              {isEventPast && (
                <Badge variant="outline" className="text-xs">
                  Past
                </Badge>
              )}
            </div>

            {event.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {event.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(eventDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(eventDate, 'h:mm a')}</span>
              </div>
              {event.duration_minutes && (
                <span className="text-xs">
                  ({event.duration_minutes} min)
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              {event.virtual_link && (
                <div className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  <span>Virtual</span>
                </div>
              )}
              {event.max_attendees && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Max {event.max_attendees}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-bookconnect-terracotta font-medium mt-2">
              {relativeTime}
            </div>

            {/* RSVP Section */}
            {!isEventPast && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <RSVPButtons
                  meetingId={event.id}
                  clubId={clubId}
                  isMember={isMember}
                  isUpcoming={!isEventPast}
                  compact={true}
                  className="mb-3"
                />

                {/* RSVP Stats for admins */}
                <RSVPStats
                  meetingId={event.id}
                  clubId={clubId}
                  isMember={isMember}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8">
      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
      <p className="text-gray-600 mb-4">
        {isAdmin
          ? "Create your first club event to get members engaged!"
          : "Check back later for upcoming club events."
        }
      </p>
      {isAdmin && canManageClubEvents && (
        <Button onClick={handleCreateEvent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      )}
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-8">
      <p className="text-red-500 mb-4">Failed to load events</p>
      <Button onClick={refresh} variant="outline">
        Try Again
      </Button>
    </div>
  );

  // Don't show events section to non-members
  if (!isMember) {
    return null;
  }

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Club Events
          </CardTitle>
          {isAdmin && canManageClubEvents && meetings.length > 0 && (
            <Button onClick={handleCreateEvent} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {loading && renderLoadingSkeleton()}
        {error && renderErrorState()}
        {!loading && !error && meetings.length === 0 && renderEmptyState()}
        {!loading && !error && meetings.length > 0 && (
          <div className="space-y-4">
            {eventsToShow.map(renderEventCard)}

            {hasMoreEvents && !showAll && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="w-full"
                >
                  Show All Events ({meetings.length})
                </Button>
              </div>
            )}

            {showAll && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(false)}
                  className="w-full"
                >
                  Show Less
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Event Creation Modal */}
      <EventCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
        clubId={clubId}
      />
    </Card>
  );
};

export default EventsSection;
