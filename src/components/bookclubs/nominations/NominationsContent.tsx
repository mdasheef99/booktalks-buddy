import React, { useState, useEffect } from 'react';
import { Nomination } from '@/lib/api/bookclubs/types';
import NominationCard from './NominationCard';
import NominationGrid from './NominationGrid';
import NominationsEmptyState from './NominationsEmptyState';
import NominationsErrorState from './NominationsErrorState';
import NominationsLoadingState from './NominationsLoadingState';
import { ErrorType } from './ErrorDisplay';
import { useNavigate } from 'react-router-dom';

interface NominationsContentProps {
  nominations: Nomination[];
  loading: boolean;
  error: string | null;
  viewMode: 'list' | 'grid';
  isAdmin: boolean;
  clubId: string;
  onRefresh: () => void;
  onOpenSearchModal: () => void;
}

/**
 * Main content component for the nominations page
 * Handles different states (loading, error, empty, content) with smooth transitions
 */
const NominationsContent: React.FC<NominationsContentProps> = ({
  nominations,
  loading,
  error,
  viewMode,
  isAdmin,
  clubId,
  onRefresh,
  onOpenSearchModal
}) => {
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [errorType, setErrorType] = useState<ErrorType>('unknown');
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);

  // Determine error type based on error message
  useEffect(() => {
    if (!error) return;

    const errorLower = error.toLowerCase();

    if (errorLower.includes('network') || errorLower.includes('connect') || errorLower.includes('timeout')) {
      setErrorType('connection');
    } else if (errorLower.includes('permission') || errorLower.includes('unauthorized') || errorLower.includes('forbidden')) {
      setErrorType('permission');
    } else if (errorLower.includes('not found') || errorLower.includes('404')) {
      setErrorType('notFound');
    } else if (errorLower.includes('validation') || errorLower.includes('invalid')) {
      setErrorType('validation');
    } else {
      setErrorType('unknown');
    }
  }, [error]);

  // Handle retry with exponential backoff
  const handleRetry = () => {
    // Increment retry count
    setRetryCount(prev => prev + 1);

    // Calculate backoff time (exponential with jitter)
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
    const delay = exponentialDelay + jitter;

    // Show retry message
    setErrorDetails(`Retrying in ${Math.round(delay / 1000)} seconds...`);

    // Schedule retry
    setTimeout(() => {
      setErrorDetails(undefined);
      onRefresh();
    }, delay);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/book-club/${clubId}`);
  };

  if (error) {
    return (
      <NominationsErrorState
        error={error}
        errorType={errorType}
        errorDetails={errorDetails}
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  if (loading) {
    return <NominationsLoadingState viewMode={viewMode} />;
  }

  if (nominations.length === 0) {
    return <NominationsEmptyState onOpenSearchModal={onOpenSearchModal} />;
  }

  // Render content with animation
  return (
    <div className="animate-fade-in">
      {viewMode === 'grid' ? (
        <NominationGrid
          nominations={nominations}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
          clubId={clubId}
        />
      ) : (
        <div className="space-y-4">
          {nominations.map((nomination) => (
            <NominationCard
              key={nomination.id}
              nomination={nomination}
              isAdmin={isAdmin}
              onRefresh={onRefresh}
              clubId={clubId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NominationsContent;
