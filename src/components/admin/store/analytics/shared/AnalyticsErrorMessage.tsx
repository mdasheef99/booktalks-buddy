/**
 * Analytics Error Message Component
 * 
 * User-friendly error display for analytics failures
 * Provides actionable feedback and retry options
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Wifi, 
  Shield,
  Clock,
  HelpCircle
} from 'lucide-react';
import type { AnalyticsError } from '@/lib/api/store/analytics/errorHandling';

// =========================
// Component Props Interface
// =========================

interface AnalyticsErrorMessageProps {
  error: AnalyticsError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

// =========================
// Error Icon Mapping
// =========================

const getErrorIcon = (errorCode: string) => {
  switch (errorCode) {
    case 'DATABASE_FUNCTION_MISSING':
      return <Database className="h-4 w-4" />;
    case 'NETWORK_ERROR':
      return <Wifi className="h-4 w-4" />;
    case 'UNAUTHORIZED':
      return <Shield className="h-4 w-4" />;
    case 'TIMEOUT':
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

// =========================
// Error Color Mapping
// =========================

const getErrorSeverity = (errorCode: string) => {
  switch (errorCode) {
    case 'DATABASE_FUNCTION_MISSING':
      return 'warning'; // Yellow - temporary issue
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return 'warning'; // Yellow - retryable
    case 'UNAUTHORIZED':
      return 'destructive'; // Red - permission issue
    default:
      return 'default'; // Gray - unknown
  }
};

// =========================
// Main Component
// =========================

/**
 * Analytics Error Message Component
 * Displays user-friendly error messages with appropriate actions
 */
export const AnalyticsErrorMessage: React.FC<AnalyticsErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false
}) => {
  const icon = getErrorIcon(error.code);
  const severity = getErrorSeverity(error.code);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        {icon}
        <span className="text-sm text-yellow-800 flex-1">
          {error.userMessage}
        </span>
        {error.isRetryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant={severity as any} className={className}>
      {icon}
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <p className="font-medium">Analytics Temporarily Unavailable</p>
            <p className="text-sm mt-1">{error.userMessage}</p>
          </div>

          {/* Error-specific guidance */}
          {error.code === 'DATABASE_FUNCTION_MISSING' && (
            <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-medium text-blue-800 mb-1">What's happening?</p>
              <p className="text-blue-700">
                Analytics features are being deployed. This usually takes 2-5 minutes to complete.
              </p>
            </div>
          )}

          {error.code === 'NETWORK_ERROR' && (
            <div className="text-sm bg-orange-50 p-3 rounded border border-orange-200">
              <p className="font-medium text-orange-800 mb-1">Connection Issue</p>
              <p className="text-orange-700">
                Please check your internet connection and try again.
              </p>
            </div>
          )}

          {error.code === 'UNAUTHORIZED' && (
            <div className="text-sm bg-red-50 p-3 rounded border border-red-200">
              <p className="font-medium text-red-800 mb-1">Access Restricted</p>
              <p className="text-red-700">
                Contact your administrator if you believe you should have access to this data.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {error.isRetryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="ml-auto"
              >
                Dismiss
              </Button>
            )}
          </div>

          {/* Development info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs font-medium cursor-pointer flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Developer Info
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                <div><strong>Error Code:</strong> {error.code}</div>
                <div><strong>Message:</strong> {error.message}</div>
                <div><strong>Retryable:</strong> {error.isRetryable ? 'Yes' : 'No'}</div>
              </div>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AnalyticsErrorMessage;
