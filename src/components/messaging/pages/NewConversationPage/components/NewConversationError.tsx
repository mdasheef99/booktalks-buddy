/**
 * New Conversation Error Component
 * 
 * Error state for the new conversation page
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { NewConversationErrorProps } from '../types';

/**
 * New Conversation Error Component
 */
export const NewConversationError: React.FC<NewConversationErrorProps> = ({
  onRetry,
  onBack
}) => {
  return (
    <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white">
      <div className="text-center p-6">
        <ErrorIcon />
        <ErrorMessage />
        <ErrorActions onRetry={onRetry} onBack={onBack} />
      </div>
    </div>
  );
};

/**
 * Error Icon Component
 */
const ErrorIcon: React.FC = () => {
  return (
    <div className="text-red-500 mb-4">
      <AlertCircle className="h-12 w-12 mx-auto" />
    </div>
  );
};

/**
 * Error Message Component
 */
const ErrorMessage: React.FC = () => {
  return (
    <>
      <p className="text-red-500 mb-4 font-medium">
        Failed to load new conversation page
      </p>
      <p className="text-gray-600 text-sm mb-4">
        Please check your connection and try again
      </p>
    </>
  );
};

/**
 * Error Actions Component
 */
interface ErrorActionsProps {
  onRetry?: () => void;
  onBack?: () => void;
}

const ErrorActions: React.FC<ErrorActionsProps> = ({ onRetry, onBack }) => {
  return (
    <div className="flex gap-2 justify-center">
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Retry
        </Button>
      )}
      {onBack && (
        <Button 
          onClick={onBack} 
          className="bg-bookconnect-sage hover:bg-bookconnect-sage/90"
        >
          Back to Messages
        </Button>
      )}
    </div>
  );
};
