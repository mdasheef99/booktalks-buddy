import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getEvent, Event } from '@/lib/api/bookclubs/events';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { exportParticipantsAsCSV } from './utils';
import { handleError, ErrorType, createStandardError } from '@/lib/utils/error-handling';
import { useEventRealtime } from '@/hooks/useEventRealtime';
import { useParticipantsRealtime } from '@/hooks/useParticipantsRealtime';
import {
  ParticipantListHeader,
  ParticipantListFilters,
  ParticipantListTabs,
  ParticipantListSummary,
  ParticipantListLoading,
  ParticipantListError,
  ParticipantListEmpty
} from './components';
import {
  EventParticipantsListProps,
  LoadingStates,
  ErrorStates,
  RsvpStatus,
  ExportFormat
} from './types';

/**
 * Component for displaying and managing event participants
 */
const EventParticipantsList: React.FC<EventParticipantsListProps> = ({ eventId }) => {
  // State for UI controls
  const [activeTab, setActiveTab] = useState<RsvpStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('filtered');

  // State for loading indicators
  const [loading, setLoading] = useState<LoadingStates>({
    event: true,
    participants: true,
    counts: true
  });

  // State for error handling
  const [errors, setErrors] = useState<ErrorStates>({
    event: null,
    participants: null,
    counts: null
  });

  // State for event details with proper typing
  const [event, setEvent] = useState<Event | null>(null);

  // Use event real-time hook
  useEventRealtime({
    eventId,
    initialEvents: event ? [event] : [],
    onDataChange: (events) => {
      if (events.length > 0) {
        setEvent(events[0]);
      }
    },
    showToasts: false
  });

  // Use participants real-time hook
  const { participants, counts } = useParticipantsRealtime({
    eventId,
    showToasts: false
  });

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!eventId) return;

      setLoading({
        event: true,
        participants: true,
        counts: true
      });

      setErrors({
        event: null,
        participants: null,
        counts: null
      });

      try {
        // Fetch event details
        const eventDetails = await getEvent(eventId);
        setEvent(eventDetails);

        // Initial data loaded successfully
      } catch (error) {
        // Create a standard error with recovery action
        const standardError = createStandardError(
          ErrorType.FETCH,
          'Failed to load event details',
          'Unable to retrieve the event information. This may affect some functionality.',
          error instanceof Error ? error : undefined,
          () => loadInitialData()
        );

        // Handle the error (logs and shows toast)
        handleError(standardError, 'EventParticipantsList.loadInitialData');

        // Update component error state
        setErrors(prev => ({
          ...prev,
          event: error instanceof Error ? error : new Error(standardError.message)
        }));
      } finally {
        setLoading(prev => ({ ...prev, event: false }));
      }
    };

    loadInitialData();
  }, [eventId, refreshKey]);

  // Update loading state based on real-time connection status
  useEffect(() => {
    // Update loading state when real-time data is available
    if (participants.length > 0) {
      setLoading(prev => ({ ...prev, participants: false }));
    } else {
      // Set a timeout to stop showing loading state after a reasonable time
      // This prevents infinite loading if there are no participants
      const timer = setTimeout(() => {
        setLoading(prev => ({ ...prev, participants: false }));
      }, 3000); // 3 seconds timeout

      return () => clearTimeout(timer);
    }

    if (counts.total >= 0) {
      setLoading(prev => ({ ...prev, counts: false }));
    }
  }, [participants.length, counts.total]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab]);

  // Memoized filtered participants based on active tab and search query
  const filteredParticipants = useMemo(() => {
    return participants.filter(
      (participant) =>
        // Filter by tab
        (activeTab === 'all' || participant.rsvp_status === activeTab) &&
        // Filter by search query (case insensitive)
        (debouncedSearchQuery === '' ||
          (participant.user.username &&
           participant.user.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
          participant.user.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    );
  }, [participants, activeTab, debouncedSearchQuery]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    // Increment refresh key to trigger initial data load
    setRefreshKey(prev => prev + 1);

    // Reset loading states
    setLoading({
      event: true,
      participants: true,
      counts: true
    });

    // Show toast
    toast.success('Refreshing participant data...', {
      description: 'Fetching the latest participant information',
      duration: 2000
    });

    // Set a timeout to ensure loading state is cleared even if no data is returned
    setTimeout(() => {
      setLoading(prev => ({
        ...prev,
        participants: false,
        counts: false
      }));
    }, 5000); // 5 seconds timeout as a fallback
  }, []);

  // Export participants as CSV
  const handleExportParticipants = useCallback(async () => {
    if (participants.length === 0) {
      const error = createStandardError(
        ErrorType.VALIDATION,
        'No participants to export',
        'There are no participants available to export.'
      );
      handleError(error, 'EventParticipantsList.handleExportParticipants');
      return;
    }

    try {
      setExportLoading(true);
      toast.info('Preparing export...', { duration: 2000 });

      await exportParticipantsAsCSV(
        participants,
        event,
        exportFormat,
        filteredParticipants,
        setExportLoading
      );

      const participantCount = exportFormat === 'filtered' ? filteredParticipants.length : participants.length;
      toast.success('Export successful', {
        description: `${participantCount} participants exported to CSV.`
      });
    } catch (error) {
      const standardError = createStandardError(
        ErrorType.UNKNOWN,
        'Export failed',
        'There was a problem exporting the participants.',
        error instanceof Error ? error : undefined,
        () => handleExportParticipants()
      );

      handleError(standardError, 'EventParticipantsList.handleExportParticipants');
    } finally {
      setExportLoading(false);
    }
  }, [event, participants, filteredParticipants, exportFormat]);

  // Send email to participants (placeholder function)
  const sendEmailToParticipants = useCallback(() => {
    toast.info('Email feature coming soon', {
      description: 'The ability to send emails to participants will be available in a future update.',
      duration: 4000
    });
  }, []);

  // Check if all data is loading
  const isFullyLoading = loading.event && loading.participants && loading.counts;

  // Check if there are any errors
  const hasErrors = errors.event || errors.participants || errors.counts;

  // Full loading skeleton
  if (isFullyLoading) {
    return <ParticipantListLoading />;
  }

  // Error state
  if (hasErrors) {
    return <ParticipantListError errors={errors} handleRefresh={handleRefresh} />;
  }

  // No participants
  if (!loading.participants && counts.total === 0) {
    return <ParticipantListEmpty loading={loading} event={event} handleRefresh={handleRefresh} />;
  }

  return (
    <Card>
      <CardHeader>
        <ParticipantListHeader
          event={event}
          loading={loading}
          isFullyLoading={isFullyLoading}
          handleRefresh={handleRefresh}
          exportParticipants={handleExportParticipants}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          exportLoading={exportLoading}
          sendEmailToParticipants={sendEmailToParticipants}
          participants={participants}
        />

        <ParticipantListFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          isFullyLoading={isFullyLoading}
          participants={participants}
          filteredParticipants={filteredParticipants}
          debouncedSearchQuery={debouncedSearchQuery}
        />
      </CardHeader>

      <CardContent>
        <ParticipantListTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={counts}
          filteredParticipants={filteredParticipants}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          loading={loading}
        />
      </CardContent>

      <CardFooter className="border-t pt-6">
        <ParticipantListSummary counts={counts} event={event} />
      </CardFooter>
    </Card>
  );
};

export default EventParticipantsList;
