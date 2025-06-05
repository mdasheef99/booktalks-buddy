import React from 'react';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttendeeCountDisplayProps {
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  maxAttendees?: number | null;
  className?: string;
  showDetails?: boolean;
}

/**
 * Component to display attendee counts with limit warnings
 */
const AttendeeCountDisplay: React.FC<AttendeeCountDisplayProps> = ({
  goingCount,
  maybeCount,
  notGoingCount,
  maxAttendees,
  className = '',
  showDetails = true
}) => {
  const totalResponses = goingCount + maybeCount + notGoingCount;
  const isNearLimit = maxAttendees && goingCount >= maxAttendees * 0.8;
  const isFull = maxAttendees && goingCount >= maxAttendees;

  const getStatusColor = () => {
    if (isFull) return 'text-red-600';
    if (isNearLimit) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (isFull) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (isNearLimit) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Attendee Count */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-500" />
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${getStatusColor()}`}>
            {goingCount} attending
          </span>
          {maxAttendees && (
            <span className="text-gray-500">
              / {maxAttendees} max
            </span>
          )}
          {getStatusIcon()}
        </div>
      </div>

      {/* Status Alert */}
      {isFull && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This event is full. No more attendees can RSVP as "Going".
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && !isFull && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This event is nearly full. Only {maxAttendees! - goingCount} spots remaining.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Breakdown */}
      {showDetails && totalResponses > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            {goingCount} Going
          </Badge>
          {maybeCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              {maybeCount} Maybe
            </Badge>
          )}
          {notGoingCount > 0 && (
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              {notGoingCount} Not Going
            </Badge>
          )}
        </div>
      )}

      {/* No Limit Message */}
      {!maxAttendees && showDetails && (
        <p className="text-xs text-gray-500">
          No attendee limit set for this event
        </p>
      )}
    </div>
  );
};

export default AttendeeCountDisplay;
