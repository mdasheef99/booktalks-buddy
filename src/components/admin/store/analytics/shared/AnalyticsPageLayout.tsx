import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalyticsPageLayoutProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  loadingText?: string;
  errorMessage?: string;
}

/**
 * Shared layout component for analytics pages
 * Handles loading states, error states, and consistent container styling
 */
export const AnalyticsPageLayout: React.FC<AnalyticsPageLayoutProps> = ({
  children,
  isLoading = false,
  error = null,
  loadingText = "Loading analytics...",
  errorMessage = "Failed to load analytics data. Please try refreshing the page."
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text={loadingText} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Success state - render children with consistent container
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {children}
    </div>
  );
};
