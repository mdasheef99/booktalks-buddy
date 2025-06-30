import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface OffersErrorProps {
  onRetry: () => void;
}

/**
 * Error state component for the Offers page
 * Displays when there's an error loading offers
 */
export const OffersError: React.FC<OffersErrorProps> = ({ onRetry }) => {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Unable to load offers
      </h3>
      <p className="text-gray-600 mb-4">
        There was a problem loading the promotional offers. Please try again.
      </p>
      <Button 
        onClick={onRetry} 
        variant="outline"
        className="text-bookconnect-brown border-bookconnect-brown/20 hover:bg-bookconnect-brown/5"
      >
        Try Again
      </Button>
    </div>
  );
};
