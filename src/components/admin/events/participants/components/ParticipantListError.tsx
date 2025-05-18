import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { ParticipantListErrorProps } from '../types';
import { ErrorType } from '@/lib/utils/error-handling';

/**
 * Error state component for the participant list
 */
const ParticipantListError: React.FC<ParticipantListErrorProps> = ({
  errors,
  handleRefresh
}) => {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <CardTitle>Error Loading Data</CardTitle>
        </div>
        <CardDescription>
          There was a problem loading the event participants data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="alert" aria-live="assertive">
          {errors.event && (
            <div className="p-4 bg-red-50 rounded-md border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="font-medium text-red-800">Event Details Error</p>
              </div>
              <p className="text-sm text-red-600 ml-6">{errors.event.message}</p>
              <p className="text-xs text-red-500 ml-6 mt-1">
                This may affect the display of event information.
              </p>
            </div>
          )}

          {errors.participants && (
            <div className="p-4 bg-red-50 rounded-md border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="font-medium text-red-800">Participants Error</p>
              </div>
              <p className="text-sm text-red-600 ml-6">{errors.participants.message}</p>
              <p className="text-xs text-red-500 ml-6 mt-1">
                Unable to load participant information. This may affect the participant list display.
              </p>
            </div>
          )}

          {errors.counts && (
            <div className="p-4 bg-red-50 rounded-md border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="font-medium text-red-800">Participant Counts Error</p>
              </div>
              <p className="text-sm text-red-600 ml-6">{errors.counts.message}</p>
              <p className="text-xs text-red-500 ml-6 mt-1">
                Unable to load participant counts. Some statistics may be inaccurate.
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Reload Page</span>
        </Button>

        <Button
          onClick={handleRefresh}
          className="flex items-center gap-1"
          aria-label="Retry loading data"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Loading Data</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ParticipantListError;
