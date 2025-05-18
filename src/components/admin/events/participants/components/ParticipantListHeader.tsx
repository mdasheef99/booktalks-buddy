import React from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Download, Mail, Calendar } from 'lucide-react';
import { ParticipantListHeaderProps } from '../types';

/**
 * Header component for the participant list
 */
const ParticipantListHeader: React.FC<ParticipantListHeaderProps> = ({
  event,
  loading,
  isFullyLoading,
  handleRefresh,
  exportParticipants,
  exportFormat,
  setExportFormat,
  exportLoading,
  sendEmailToParticipants,
  participants
}) => {
  return (
    <div className="flex justify-between items-start">
      <div>
        <CardTitle className="flex items-center">
          {loading.event ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <>Event Participants</>
          )}
          {loading.participants && !isFullyLoading && (
            <span className="ml-2">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {loading.event ? (
            <Skeleton className="h-4 w-60 mt-1" />
          ) : event ? (
            <div className="mt-1">
              <div className="flex items-center text-sm mb-1">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {event.start_time
                    ? new Date(event.start_time).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Date not specified'}
                </span>
              </div>
              <div>Manage participants for {event.title}</div>
            </div>
          ) : (
            'Manage participants for this event'
          )}
        </CardDescription>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          title="Refresh participant list"
          disabled={isFullyLoading}
          aria-label="Refresh participant list"
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading.participants ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={exportParticipants}
            title={`Export ${exportFormat === 'filtered' ? 'filtered' : 'all'} participants as CSV`}
            disabled={exportLoading || isFullyLoading || participants.length === 0}
            aria-label={`Export ${exportFormat === 'filtered' ? 'filtered' : 'all'} participants as CSV`}
            className="flex items-center"
          >
            <Download className={`h-4 w-4 mr-2 ${exportLoading ? 'animate-bounce' : ''}`} />
            <span>Export {exportFormat === 'filtered' ? 'Filtered' : 'All'}</span>
            {exportLoading && <span className="sr-only">(Loading...)</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 absolute -right-9 top-0"
            onClick={() => setExportFormat(prev => prev === 'filtered' ? 'all' : 'filtered')}
            title={`Switch to export ${exportFormat === 'filtered' ? 'all' : 'filtered'} participants`}
            disabled={exportLoading || isFullyLoading}
            aria-label={`Switch to export ${exportFormat === 'filtered' ? 'all' : 'filtered'} participants`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
            </svg>
            <span className="sr-only">
              Switch to export {exportFormat === 'filtered' ? 'all' : 'filtered'} participants
            </span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={sendEmailToParticipants}
          title="Send email to participants"
          disabled={isFullyLoading || participants.length === 0}
          aria-label="Send email to all participants"
          className="flex items-center"
        >
          <Mail className="h-4 w-4 mr-2" />
          <span>Email All</span>
          {participants.length > 0 && (
            <span className="ml-1 text-xs bg-gray-200 text-gray-800 rounded-full px-1.5 py-0.5">
              {participants.length}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ParticipantListHeader;
