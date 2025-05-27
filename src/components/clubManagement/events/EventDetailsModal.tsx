/**
 * Event Details Modal Component
 *
 * Modal for viewing detailed information about a club meeting.
 */

import React from 'react';
import { Calendar, Clock, Users, Video, MapPin, User, Type, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ClubMeeting } from '@/lib/services/clubManagementService';

// =====================================================
// Types
// =====================================================

interface EventDetailsModalProps {
  event: ClubMeeting | null;
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
}

// =====================================================
// Event Details Modal Component
// =====================================================

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  clubId
}) => {
  if (!event) return null;

  // Helper function to get meeting type badge
  const getMeetingTypeBadge = (type: string) => {
    const badges = {
      discussion: { label: 'Book Discussion', className: 'bg-blue-100 text-blue-800', icon: '📚' },
      social: { label: 'Social Meetup', className: 'bg-green-100 text-green-800', icon: '☕' },
      planning: { label: 'Planning Meeting', className: 'bg-purple-100 text-purple-800', icon: '📋' },
      author_event: { label: 'Author Event', className: 'bg-amber-100 text-amber-800', icon: '✍️' },
      other: { label: 'Other', className: 'bg-gray-100 text-gray-800', icon: '📅' }
    };
    
    const badge = badges[type as keyof typeof badges] || badges.other;
    return (
      <Badge className={badge.className}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </Badge>
    );
  };

  // Format date and time
  const scheduledDate = new Date(event.scheduled_at);
  const isEventPast = isPast(scheduledDate);
  const formattedDate = format(scheduledDate, 'EEEE, MMMM dd, yyyy');
  const formattedTime = format(scheduledDate, 'h:mm a');
  const relativeTime = formatDistanceToNow(scheduledDate, { addSuffix: true });

  // Calculate end time
  const endTime = new Date(scheduledDate.getTime() + event.duration_minutes * 60000);
  const formattedEndTime = format(endTime, 'h:mm a');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {event.title}
              </h2>
              {getMeetingTypeBadge(event.meeting_type)}
            </div>
            {isEventPast && (
              <Badge variant="outline" className="text-gray-500">
                Past Event
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Meeting details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date and Time Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date & Time
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formattedTime} - {formattedEndTime} ({event.duration_minutes} minutes)</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className={isEventPast ? 'text-gray-500' : 'text-bookconnect-terracotta font-medium'}>
                  {relativeTime}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {event.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}

          {/* Meeting Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Type className="h-5 w-5" />
              Meeting Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Virtual Link */}
              {event.virtual_link && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-700">Virtual Meeting</span>
                  </div>
                  <a
                    href={event.virtual_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {event.virtual_link}
                  </a>
                </div>
              )}

              {/* Max Attendees */}
              {event.max_attendees && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-gray-700">Capacity</span>
                  </div>
                  <p className="text-gray-600">
                    Maximum {event.max_attendees} attendees
                  </p>
                </div>
              )}

              {/* Recurring Info */}
              {event.is_recurring && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-gray-700">Recurring</span>
                  </div>
                  <p className="text-gray-600">
                    This is a recurring meeting
                  </p>
                </div>
              )}

              {/* Creator Info */}
              {event.creator_username && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Created by</span>
                  </div>
                  <p className="text-gray-600">{event.creator_username}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(event.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {event.virtual_link && !isEventPast && (
              <Button asChild>
                <a
                  href={event.virtual_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  Join Meeting
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;
