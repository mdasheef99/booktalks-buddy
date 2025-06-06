/**
 * RSVP Buttons Component
 *
 * Provides RSVP functionality for club meetings with Going/Maybe/Not Going options.
 * Only available to club members for club-specific events.
 */

import React, { useState } from 'react';
import { Check, Clock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useClubEventRSVP } from '@/hooks/clubManagement/useClubEventRSVP';
import { RSVPStatus } from '@/lib/api/clubManagement/types';

// =====================================================
// Types
// =====================================================

interface RSVPButtonsProps {
  meetingId: string;
  clubId: string;
  isMember: boolean;
  isUpcoming?: boolean;
  compact?: boolean;
  className?: string;
}

// =====================================================
// RSVP Buttons Component
// =====================================================

const RSVPButtons: React.FC<RSVPButtonsProps> = ({
  meetingId,
  clubId,
  isMember,
  isUpcoming = true,
  compact = false,
  className = ''
}) => {
  const [pendingStatus, setPendingStatus] = useState<RSVPStatus | null>(null);
  
  const {
    userRSVP,
    rsvpLoading,
    rsvpError,
    updateRSVP,
    removeRSVP,
    canRSVP
  } = useClubEventRSVP(meetingId, clubId, isMember);

  // Don't show RSVP buttons for non-members or past events
  if (!isMember || !isUpcoming || !canRSVP) {
    return null;
  }

  const handleRSVP = async (status: RSVPStatus) => {
    try {
      setPendingStatus(status);

      if (userRSVP?.rsvp_status === status) {
        // If clicking the same status, remove RSVP
        await removeRSVP();
        toast.success('RSVP removed');
      } else {
        // Update to new status
        await updateRSVP(status);
        toast.success(`RSVP updated to ${getStatusLabel(status)}`);
      }
    } catch (error) {
      console.error('RSVP error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('full')) {
          toast.error(error.message, {
            duration: 5000,
            description: 'Try RSVPing as "Maybe" or check back later if someone cancels.'
          });
        } else {
          toast.error(error.message || 'Failed to update RSVP. Please try again.');
        }
      } else {
        toast.error('Failed to update RSVP. Please try again.');
      }
    } finally {
      setPendingStatus(null);
    }
  };

  const getStatusLabel = (status: RSVPStatus): string => {
    switch (status) {
      case 'going': return 'Going';
      case 'maybe': return 'Maybe';
      case 'not_going': return 'Not Going';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: RSVPStatus) => {
    const isLoading = pendingStatus === status && rsvpLoading;
    
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    switch (status) {
      case 'going': return <Check className="h-4 w-4" />;
      case 'maybe': return <Clock className="h-4 w-4" />;
      case 'not_going': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  const getButtonVariant = (status: RSVPStatus) => {
    const isSelected = userRSVP?.rsvp_status === status;
    const isLoading = pendingStatus === status && rsvpLoading;
    
    if (isSelected) {
      switch (status) {
        case 'going': return 'default';
        case 'maybe': return 'secondary';
        case 'not_going': return 'destructive';
        default: return 'outline';
      }
    }
    
    return 'outline';
  };

  const getButtonClassName = (status: RSVPStatus) => {
    const isSelected = userRSVP?.rsvp_status === status;
    const baseClasses = compact ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm';
    
    if (isSelected) {
      switch (status) {
        case 'going': 
          return `${baseClasses} bg-green-600 hover:bg-green-700 text-white border-green-600`;
        case 'maybe': 
          return `${baseClasses} bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500`;
        case 'not_going': 
          return `${baseClasses} bg-red-600 hover:bg-red-700 text-white border-red-600`;
        default: 
          return baseClasses;
      }
    }
    
    return `${baseClasses} hover:bg-gray-50`;
  };

  if (rsvpError) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        Failed to load RSVP status
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Current RSVP Status Badge */}
      {userRSVP && (
        <Badge 
          variant="outline" 
          className={`text-xs ${compact ? 'px-2 py-1' : 'px-3 py-1'}`}
        >
          {getStatusLabel(userRSVP.rsvp_status)}
        </Badge>
      )}
      
      {/* RSVP Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant={getButtonVariant('going')}
          size={compact ? 'sm' : 'default'}
          onClick={() => handleRSVP('going')}
          disabled={rsvpLoading}
          className={getButtonClassName('going')}
          title="I'm going to this event"
        >
          {getStatusIcon('going')}
          {!compact && <span className="ml-1">Going</span>}
        </Button>

        <Button
          variant={getButtonVariant('maybe')}
          size={compact ? 'sm' : 'default'}
          onClick={() => handleRSVP('maybe')}
          disabled={rsvpLoading}
          className={getButtonClassName('maybe')}
          title="I might attend this event"
        >
          {getStatusIcon('maybe')}
          {!compact && <span className="ml-1">Maybe</span>}
        </Button>

        <Button
          variant={getButtonVariant('not_going')}
          size={compact ? 'sm' : 'default'}
          onClick={() => handleRSVP('not_going')}
          disabled={rsvpLoading}
          className={getButtonClassName('not_going')}
          title="I won't be attending this event"
        >
          {getStatusIcon('not_going')}
          {!compact && <span className="ml-1">Not Going</span>}
        </Button>
      </div>
    </div>
  );
};

export default RSVPButtons;
