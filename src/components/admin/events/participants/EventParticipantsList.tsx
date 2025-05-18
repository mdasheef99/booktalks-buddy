import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import {
  ParticipantListHeader,
  ParticipantListFilters,
  ParticipantListTabs,
  ParticipantListSummary,
  ParticipantListLoading,
  ParticipantListError,
  ParticipantListEmpty
} from './components';
import { EventParticipantsListProps } from './types';
import {
  useParticipantsData,
  useParticipantsFiltering,
  useParticipantsExport
} from './hooks';

/**
 * Component for displaying and managing event participants
 */
const EventParticipantsList: React.FC<EventParticipantsListProps> = ({ eventId }) => {
  // Use the data hook for loading and managing participant data
  const {
    event,
    participants,
    counts,
    loading,
    errors,
    isFullyLoading,
    hasErrors,
    handleRefresh
  } = useParticipantsData(eventId);

  // Use the filtering hook for search and filtering
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    filteredParticipants
  } = useParticipantsFiltering(participants);

  // Use the export hook for exporting functionality
  const {
    exportLoading,
    exportFormat,
    setExportFormat,
    handleExportParticipants,
    sendEmailToParticipants
  } = useParticipantsExport(participants, filteredParticipants, event);

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
