import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getEventParticipantCounts } from '@/lib/api/bookclubs/participants';
import { handleError, ErrorType, createStandardError } from '@/lib/utils/error-handling';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EventParticipantsSummaryProps {
  eventId: string;
}

/**
 * Component for displaying a compact summary of event participants
 */
const EventParticipantsSummary: React.FC<EventParticipantsSummaryProps> = ({ eventId }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<{ going: number; maybe: number; not_going: number; total: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!eventId) return;

      setLoading(true);
      setError(null);

      try {
        const fetchedCounts = await getEventParticipantCounts(eventId);
        const total = (fetchedCounts.going || 0) + (fetchedCounts.maybe || 0) + (fetchedCounts.not_going || 0);

        setCounts({
          going: fetchedCounts.going || 0,
          maybe: fetchedCounts.maybe || 0,
          not_going: fetchedCounts.not_going || 0,
          total
        });
      } catch (error) {
        // Create a standard error
        const standardError = createStandardError(
          ErrorType.FETCH,
          'Failed to load participant counts',
          'Unable to retrieve the participant count information.',
          error instanceof Error ? error : undefined
        );

        // Handle the error (logs and shows toast)
        handleError(standardError, 'EventParticipantsSummary.fetchCounts', true); // Silent mode

        // Update component error state
        setError(error instanceof Error ? error : new Error('Failed to load participant counts'));
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [eventId]);

  const handleViewParticipants = () => {
    navigate(`/admin/events/edit/${eventId}?tab=participants`);
  };

  if (loading) {
    return (
      <div className="mt-2 flex items-center space-x-2">
        <Users className="h-4 w-4 text-gray-400" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 flex items-center space-x-2 text-gray-500 text-xs">
        <Users className="h-4 w-4 text-gray-400" />
        <span>Unable to load participants</span>
      </div>
    );
  }

  if (!counts || counts.total === 0) {
    return (
      <div className="mt-2 flex items-center space-x-2 text-gray-500 text-xs">
        <Users className="h-4 w-4 text-gray-400" />
        <span>No participants yet</span>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span className="font-medium">{counts.total} Participants</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
          onClick={handleViewParticipants}
        >
          View All
        </Button>
      </div>
      
      <div className="flex items-center space-x-3 mt-1 text-xs">
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          <span>{counts.going}</span>
        </div>
        <div className="flex items-center text-amber-600">
          <HelpCircle className="h-3 w-3 mr-1" />
          <span>{counts.maybe}</span>
        </div>
        <div className="flex items-center text-red-600">
          <XCircle className="h-3 w-3 mr-1" />
          <span>{counts.not_going}</span>
        </div>
      </div>
    </div>
  );
};

export default EventParticipantsSummary;
