import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEvent } from '@/lib/api/bookclubs/events';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Video, Building, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import RsvpButton from '@/components/events/RsvpButton';
import ParticipantsList from '@/components/events/ParticipantsList';
import { toast } from 'sonner';

/**
 * Page for displaying event details and allowing users to RSVP
 */
const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  // Fetch event details
  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventId ? getEvent(eventId) : Promise.reject('No event ID provided'),
    enabled: !!eventId
  });

  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };

  // Handle share button click
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Book Event',
        text: `Check out this event: ${event?.title}`,
        url: window.location.href
      })
      .then(() => console.log('Shared successfully'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  // Format date and time
  const formatDateTime = () => {
    if (!event) return { date: '', time: '', isPastEvent: false };
    
    try {
      // Try to parse the start_time first (new field)
      if (event.start_time) {
        const startDate = new Date(event.start_time);
        const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
        const formattedTime = format(startDate, 'h:mm a');
        
        return { 
          date: formattedDate, 
          time: formattedTime,
          isPastEvent: isPast(startDate)
        };
      }
      
      // Fall back to the date field (legacy field)
      const date = new Date(event.date);
      if (isNaN(date.getTime())) {
        return { 
          date: event.date, 
          time: '', 
          isPastEvent: false 
        };
      }
      
      const formattedDate = format(date, 'EEEE, MMMM d, yyyy');
      const formattedTime = format(date, 'h:mm a');
      
      return { 
        date: formattedDate, 
        time: formattedTime,
        isPastEvent: isPast(date)
      };
    } catch (error) {
      console.error("Error parsing date:", error);
      return { 
        date: event.date, 
        time: '', 
        isPastEvent: false 
      };
    }
  };

  const { date, time, isPastEvent } = formatDateTime();

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !event) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/events')}>View All Events</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex flex-wrap items-start gap-2 mb-4">
          {event.event_type && (
            <Badge className="bg-bookconnect-terracotta text-white">
              {event.event_type.replace('_', ' ')}
            </Badge>
          )}
          
          {event.featured_on_landing && (
            <Badge className="bg-amber-500 text-white">
              Featured
            </Badge>
          )}
          
          {isPastEvent && (
            <Badge variant="outline" className="text-muted-foreground">
              Past Event
            </Badge>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{event.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                <span className="font-medium">{date}</span>
              </div>
              
              {time && (
                <div className="flex items-center text-sm">
                  <Clock className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                  <span>{time}</span>
                </div>
              )}
              
              {event.location && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.is_virtual && (
                <div className="flex items-center text-sm">
                  <Video className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                  <span>Virtual Event</span>
                  {event.virtual_meeting_link && (
                    <a 
                      href={event.virtual_meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-bookconnect-terracotta hover:underline"
                    >
                      Join Meeting
                    </a>
                  )}
                </div>
              )}
              
              {event.store_id && (
                <div className="flex items-center text-sm">
                  <Building className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                  <span>Store Event</span>
                </div>
              )}
              
              {event.max_participants && (
                <div className="flex items-center text-sm">
                  <Users className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                  <span>Limited to {event.max_participants} participants</span>
                </div>
              )}
            </div>
            
            <div className="prose max-w-none">
              <p>{event.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {!isPastEvent && (
                <RsvpButton eventId={event.id} className="flex-1" />
              )}
              
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="flex items-center"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          
          <div>
            <ParticipantsList eventId={event.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
