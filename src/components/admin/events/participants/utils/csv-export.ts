import { Event } from '@/lib/api/bookclubs/events/types';
import { Participant } from '../types';
import { toast } from 'sonner';

/**
 * Escapes a string for CSV format
 * @param value The string to escape
 * @returns The escaped string
 */
export const escapeCSV = (value: string): string => {
  // If the value contains a comma, double quote, or newline, wrap it in double quotes
  if (/[",\n\r]/.test(value)) {
    // Replace double quotes with two double quotes
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Exports participants as a CSV file
 * @param participants The participants to export
 * @param event The event details
 * @param exportFormat Whether to export filtered or all participants
 * @param filteredParticipants The filtered participants (if exportFormat is 'filtered')
 * @param setExportLoading Function to set the export loading state
 */
export const exportParticipantsAsCSV = async (
  participants: Participant[],
  event: Event | null,
  exportFormat: 'filtered' | 'all',
  filteredParticipants: Participant[],
  setExportLoading: (loading: boolean) => void
): Promise<void> => {
  // Validate inputs
  if (!participants || participants.length === 0) {
    throw new Error('No participants to export');
  }

  try {
    setExportLoading(true);

    // Determine which participants to export based on the export format
    const participantsToExport = exportFormat === 'filtered' ? filteredParticipants : participants;

    if (participantsToExport.length === 0) {
      throw new Error('No participants match the current filter criteria');
    }

    // Create CSV content with more comprehensive data
    const headers = [
      'Name',
      'Email',
      'RSVP Status',
      'RSVP Date',
      'Event Name',
      'Event Date',
      'Event Location',
      'User ID'
    ];

    const rows = participantsToExport.map((participant) => [
      escapeCSV(participant.user.username || 'Anonymous'),
      escapeCSV(participant.user.email),
      escapeCSV(participant.rsvp_status === 'going' ? 'Going' :
                participant.rsvp_status === 'maybe' ? 'Maybe' : 'Not Going'),
      escapeCSV(new Date(participant.rsvp_at).toLocaleString()),
      escapeCSV(event?.title || 'Unknown Event'),
      escapeCSV(event?.start_time ? new Date(event.start_time).toLocaleString() : 'Date not specified'),
      escapeCSV(event?.location || (event?.is_virtual ? 'Virtual Event' : 'Location not specified')),
      escapeCSV(participant.user_id)
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    // Add timestamp to filename for better organization
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const eventName = event?.title ? `-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const fileName = `event-participants${eventName}-${timestamp}.csv`;
    link.setAttribute('download', fileName);

    // Trigger download
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);

    // Return silently - the parent component will handle success messaging
    return;
  } catch (error) {
    console.error('Error exporting participants:', error);
    // Re-throw the error to be handled by the parent component
    throw error;
  } finally {
    setExportLoading(false);
  }
};
