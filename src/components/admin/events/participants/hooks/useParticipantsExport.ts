import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Event } from '@/lib/api/bookclubs/events/types';
import { Participant, ExportFormat } from '../types';
import { exportParticipantsAsCSV } from '../utils';
import { handleError, ErrorType, createStandardError } from '@/lib/utils/error-handling';

/**
 * Hook for managing participant export functionality
 */
export function useParticipantsExport(
  participants: Participant[],
  filteredParticipants: Participant[],
  event: Event | null
) {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('filtered');

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

  return {
    exportLoading,
    exportFormat,
    setExportFormat,
    handleExportParticipants,
    sendEmailToParticipants
  };
}
