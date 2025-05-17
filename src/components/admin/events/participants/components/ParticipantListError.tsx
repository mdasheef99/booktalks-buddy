import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ParticipantListErrorProps } from '../types';

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
        <div className="space-y-4">
          {errors.event && (
            <div className="p-4 bg-red-50 rounded-md">
              <p className="font-medium text-red-800">Event Details Error</p>
              <p className="text-sm text-red-600">{errors.event.message}</p>
            </div>
          )}

          {errors.participants && (
            <div className="p-4 bg-red-50 rounded-md">
              <p className="font-medium text-red-800">Participants Error</p>
              <p className="text-sm text-red-600">{errors.participants.message}</p>
            </div>
          )}

          {errors.counts && (
            <div className="p-4 bg-red-50 rounded-md">
              <p className="font-medium text-red-800">Participant Counts Error</p>
              <p className="text-sm text-red-600">{errors.counts.message}</p>
            </div>
          )}

          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipantListError;
