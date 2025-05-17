import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getEventParticipants, getEventParticipantCounts } from '@/lib/api/bookclubs/participants';
import { getEvent } from '@/lib/api/bookclubs/events';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { exportParticipantsAsCSV } from './utils';
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
  Participant,
  ParticipantCounts,
  LoadingStates,
  ErrorStates,
  RsvpStatus
} from './types';

/**
 * Component for displaying and managing event participants
 */
const EventParticipantsList: React.FC<EventParticipantsListProps> = ({ eventId }) => {
  // State for participants data
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // State for participant counts
  const [counts, setCounts] = useState<ParticipantCounts>({
    going: 0,
    maybe: 0,
    not_going: 0,
    total: 0,
  });
  
  // State for event details with proper typing
  const [event, setEvent] = useState<any>(null);
  
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
  
  // State for UI controls
  const [activeTab, setActiveTab] = useState<RsvpStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'filtered' | 'all'>('filtered');
  
  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      setLoading(prev => ({ ...prev, event: true }));
      setErrors(prev => ({ ...prev, event: null }));
      
      try {
        const eventDetails = await getEvent(eventId);
        setEvent(eventDetails);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setErrors(prev => ({ 
          ...prev, 
          event: error instanceof Error ? error : new Error('Failed to load event details') 
        }));
        toast.error('Failed to load event details');
      } finally {
        setLoading(prev => ({ ...prev, event: false }));
      }
    };
    
    fetchEventDetails();
  }, [eventId, refreshKey]);

  // Fetch participants
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!eventId) return;
      
      setLoading(prev => ({ ...prev, participants: true }));
      setErrors(prev => ({ ...prev, participants: null }));
      
      try {
        const fetchedParticipants = await getEventParticipants(eventId);
        
        // Ensure the data matches our expected type
        const typedParticipants: Participant[] = fetchedParticipants.map(p => ({
          event_id: p.event_id,
          user_id: p.user_id,
          rsvp_status: p.rsvp_status as RsvpStatus,
          rsvp_at: p.rsvp_at,
          user: {
            username: p.user?.username || null,
            email: p.user?.email || ''
          }
        }));
        
        setParticipants(typedParticipants);
      } catch (error) {
        console.error('Error fetching participants:', error);
        setErrors(prev => ({ 
          ...prev, 
          participants: error instanceof Error ? error : new Error('Failed to load participants') 
        }));
        toast.error('Failed to load participants');
      } finally {
        setLoading(prev => ({ ...prev, participants: false }));
      }
    };
    
    fetchParticipants();
  }, [eventId, refreshKey]);

  // Fetch participant counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!eventId) return;
      
      setLoading(prev => ({ ...prev, counts: true }));
      setErrors(prev => ({ ...prev, counts: null }));
      
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
        console.error('Error fetching participant counts:', error);
        setErrors(prev => ({ 
          ...prev, 
          counts: error instanceof Error ? error : new Error('Failed to load participant counts') 
        }));
        toast.error('Failed to load participant counts');
      } finally {
        setLoading(prev => ({ ...prev, counts: false }));
      }
    };
    
    fetchCounts();
  }, [eventId, refreshKey]);

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
    setRefreshKey(prev => prev + 1);
    toast.success('Participant list refreshed');
  }, []);

  // Export participants as CSV
  const handleExportParticipants = useCallback(() => {
    exportParticipantsAsCSV(
      participants,
      event,
      exportFormat,
      filteredParticipants,
      setExportLoading
    );
  }, [event, participants, filteredParticipants, exportFormat]);

  // Send email to participants (placeholder function)
  const sendEmailToParticipants = useCallback(() => {
    toast.info('This feature is not yet implemented');
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
