/**
 * Club Management Error Boundary
 * 
 * Provides error handling and recovery for club management features.
 * Includes fallback UI and error reporting capabilities.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// =====================================================
// Types and Interfaces
// =====================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  clubId?: string;
  feature?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// =====================================================
// Error Boundary Component
// =====================================================

export class ClubManagementErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `club-mgmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Club Management Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real application, you would send this to your error reporting service
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        clubId: this.props.clubId,
        feature: this.props.feature,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.error('Error Report:', errorReport);
      
      // Example: Send to error reporting service
      // errorReportingService.report(errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/book-club';
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const { clubId, feature } = this.props;

    const bugReportData = {
      errorId,
      clubId,
      feature,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack
    };

    // In a real application, this would open a bug report form or send to support
    console.log('Bug report data:', bugReportData);
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReportData, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => alert('Failed to copy error details'));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-900">
                Something went wrong with Club Management
              </CardTitle>
              <CardDescription>
                We encountered an error while loading the club management features.
                {this.props.feature && ` (Feature: ${this.props.feature})`}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription className="font-mono text-sm">
                    <div className="font-semibold mb-2">Error Details:</div>
                    <div className="text-red-600 mb-2">{this.state.error.message}</div>
                    {this.state.errorId && (
                      <div className="text-gray-600 text-xs">Error ID: {this.state.errorId}</div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {this.retryCount < this.maxRetries && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>

                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Book Clubs
                </Button>

                <Button 
                  variant="outline" 
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-600 mt-6">
                <p>If this problem persists, please try:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Refreshing the page</li>
                  <li>Clearing your browser cache</li>
                  <li>Checking your internet connection</li>
                  <li>Contacting support if the issue continues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// =====================================================
// Hook for Error Boundary
// =====================================================

export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Manual error handling:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// =====================================================
// Higher-Order Component
// =====================================================

export function withClubManagementErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    feature?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  const WrappedComponent = (props: P & { clubId?: string }) => {
    return (
      <ClubManagementErrorBoundary
        fallback={options?.fallback}
        feature={options?.feature}
        onError={options?.onError}
        clubId={props.clubId}
      >
        <Component {...props} />
      </ClubManagementErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withClubManagementErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// =====================================================
// Specialized Error Boundaries
// =====================================================

export const AnalyticsErrorBoundary: React.FC<{ children: ReactNode; clubId?: string }> = ({ children, clubId }) => (
  <ClubManagementErrorBoundary feature="Analytics" clubId={clubId}>
    {children}
  </ClubManagementErrorBoundary>
);

export const ModeratorsErrorBoundary: React.FC<{ children: ReactNode; clubId?: string }> = ({ children, clubId }) => (
  <ClubManagementErrorBoundary feature="Moderators" clubId={clubId}>
    {children}
  </ClubManagementErrorBoundary>
);

export const EventsErrorBoundary: React.FC<{ children: ReactNode; clubId?: string }> = ({ children, clubId }) => (
  <ClubManagementErrorBoundary feature="Events" clubId={clubId}>
    {children}
  </ClubManagementErrorBoundary>
);

// =====================================================
// Default Export
// =====================================================

export default ClubManagementErrorBoundary;
