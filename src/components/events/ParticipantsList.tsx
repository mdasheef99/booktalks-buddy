import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEventParticipants, getEventParticipantCounts } from '@/lib/api/bookclubs/participants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, HelpCircle, X, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserName from '@/components/common/UserName';

// Fix for the syntax error - make sure we're importing the Card components correctly
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';

// Fix for the Collapsible components
import { Collapsible } from '@/components/ui/collapsible';
import { CollapsibleContent } from '@/components/ui/collapsible';
import { CollapsibleTrigger } from '@/components/ui/collapsible';

interface ParticipantsListProps {
  eventId: string;
  className?: string;
}

/**
 * Component to display the list of participants for an event
 * Using a collapsible dropdown design for better UI
 */
const ParticipantsList: React.FC<ParticipantsListProps> = ({ eventId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'going' | 'maybe' | 'not_going'>('going');

  // Fetch participants
  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: () => getEventParticipants(eventId),
    enabled: !!eventId
  });

  // Fetch participant counts
  const { data: counts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['event-participant-counts', eventId],
    queryFn: () => getEventParticipantCounts(eventId),
    enabled: !!eventId
  });

  // Group participants by RSVP status
  const goingParticipants = participants?.filter(p => p.rsvp_status === 'going') || [];
  const maybeParticipants = participants?.filter(p => p.rsvp_status === 'maybe') || [];
  const notGoingParticipants = participants?.filter(p => p.rsvp_status === 'not_going') || [];

  // Get the active participants list based on the selected tab
  const getActiveParticipants = () => {
    switch (activeTab) {
      case 'going':
        return goingParticipants;
      case 'maybe':
        return maybeParticipants;
      case 'not_going':
        return notGoingParticipants;
      default:
        return goingParticipants;
    }
  };

  // Loading state
  if (isLoadingParticipants || isLoadingCounts) {
    return (
      <Card className={`${className} mt-6`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No participants yet
  if (!participants || participants.length === 0) {
    return (
      <Card className={`${className} mt-6`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No one has RSVPed to this event yet. Be the first!</p>
        </CardContent>
      </Card>
    );
  }

  const totalParticipants = (counts?.going || 0) + (counts?.maybe || 0) + (counts?.not_going || 0);

  return (
    <Card className={`${className} mt-6`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full flex items-center justify-between group">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Participants ({totalParticipants})
            </CardTitle>
            <div className="flex items-center">
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {/* Tabs for different RSVP statuses */}
            <div className="flex space-x-2 mb-4">
              <Badge
                variant={activeTab === 'going' ? 'default' : 'outline'}
                className={`cursor-pointer flex items-center ${activeTab === 'going' ? 'bg-green-600' : 'hover:bg-muted'}`}
                onClick={() => setActiveTab('going')}
              >
                <Check className="mr-1 h-3 w-3" />
                Going ({counts?.going || 0})
              </Badge>

              <Badge
                variant={activeTab === 'maybe' ? 'default' : 'outline'}
                className={`cursor-pointer flex items-center ${activeTab === 'maybe' ? 'bg-amber-500' : 'hover:bg-muted'}`}
                onClick={() => setActiveTab('maybe')}
              >
                <HelpCircle className="mr-1 h-3 w-3" />
                Maybe ({counts?.maybe || 0})
              </Badge>

              <Badge
                variant={activeTab === 'not_going' ? 'default' : 'outline'}
                className={`cursor-pointer flex items-center ${activeTab === 'not_going' ? 'bg-red-500' : 'hover:bg-muted'}`}
                onClick={() => setActiveTab('not_going')}
              >
                <X className="mr-1 h-3 w-3" />
                Not Going ({counts?.not_going || 0})
              </Badge>
            </div>

            {/* Participant list with scroll area for better UX */}
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {getActiveParticipants().length === 0 ? (
                <p className="text-muted-foreground text-sm p-2">
                  {activeTab === 'going'
                    ? "No one has confirmed they're going yet."
                    : activeTab === 'maybe'
                      ? 'No one has responded with "maybe" yet.'
                      : 'No one has declined yet.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {getActiveParticipants().map((participant) => (
                    <ParticipantItem
                      key={participant.user_id}
                      userId={participant.user_id}
                      username={participant.user?.username || 'Anonymous'}
                      email={participant.user?.email || ''}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Helper component for displaying a participant with dual-identity support
const ParticipantItem = ({
  userId,
  username,
  email
}: {
  userId: string;
  username: string;
  email: string;
}) => {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center p-2 rounded-md hover:bg-muted/50">
      <Avatar className="h-8 w-8 mr-3">
        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} />
        <AvatarFallback>{getInitials(username)}</AvatarFallback>
      </Avatar>
      <div>
        <UserName
          userId={userId}
          displayFormat="full"
          showTierBadge={true}
          className="text-sm"
        />
        {email && <p className="text-xs text-muted-foreground">{email}</p>}
      </div>
    </div>
  );
};

export default ParticipantsList;
