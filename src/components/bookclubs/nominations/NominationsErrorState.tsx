import React from 'react';
import ErrorDisplay, { ErrorType } from './ErrorDisplay';

interface NominationsErrorStateProps {
  error: string;
  errorType?: ErrorType;
  errorDetails?: string;
  onRetry: () => void;
  onBack?: () => void;
}

/**
 * Error state component for the nominations page
 * Displays different types of errors with appropriate visuals and actions
 */
const NominationsErrorState: React.FC<NominationsErrorStateProps> = ({
  error,
  errorType = 'unknown',
  errorDetails,
  onRetry,
  onBack
}) => {
  // Determine error type from error message if not explicitly provided
  const determineErrorType = (): ErrorType => {
    if (errorType !== 'unknown') return errorType;

    const errorLower = error.toLowerCase();

    if (errorLower.includes('network') || errorLower.includes('connect') || errorLower.includes('timeout')) {
      return 'connection';
    }

    if (errorLower.includes('permission') || errorLower.includes('unauthorized') || errorLower.includes('forbidden')) {
      return 'permission';
    }

    if (errorLower.includes('not found') || errorLower.includes('404')) {
      return 'notFound';
    }

    if (errorLower.includes('validation') || errorLower.includes('invalid')) {
      return 'validation';
    }

    return 'unknown';
  };

  return (
    <ErrorDisplay
      type={determineErrorType()}
      message={error}
      details={errorDetails}
      onRetry={onRetry}
      onBack={onBack}
      className="mx-auto max-w-2xl"
    />
  );
};

export default NominationsErrorState;
