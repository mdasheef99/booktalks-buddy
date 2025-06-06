/**
 * Direct Messaging System - Error Boundary Components
 * 
 * React error boundaries for messaging components to handle JavaScript errors
 * gracefully and provide fallback UI with recovery options.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, MessageCircle, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

/**
 * Main messaging error boundary component
 */
export class MessagingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Messaging Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error reporting service (e.g., Sentry)
      console.error('Production error in messaging system:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoToMessages = () => {
    window.location.href = '/messages';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white p-6">
          <div className="text-center">
            <div className="text-red-500 mb-6">
              <AlertTriangle className="h-16 w-16 mx-auto" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              We encountered an error in the messaging system. This has been logged and we'll look into it.
            </p>

            {/* Error details for development */}
            {this.props.showDetails && this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleRetry}
                className="bg-bookconnect-sage hover:bg-bookconnect-sage/90"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleGoToMessages}
                  variant="outline"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Conversation list specific error boundary
 */
export function ConversationListErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <MessagingErrorBoundary
      fallback={
        <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white">
          <div className="text-center p-6">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load conversations
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              There was an error loading your conversations. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </MessagingErrorBoundary>
  );
}

/**
 * Message thread specific error boundary
 */
export function MessageThreadErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <MessagingErrorBoundary
      fallback={
        <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white">
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load conversation
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              There was an error loading this conversation. It may have been deleted or you may not have permission to view it.
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.href = '/messages'}
                variant="outline"
              >
                Back to Messages
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </MessagingErrorBoundary>
  );
}

/**
 * New conversation specific error boundary
 */
export function NewConversationErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <MessagingErrorBoundary
      fallback={
        <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white">
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load new conversation page
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              There was an error setting up the new conversation page. Please try again.
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.href = '/messages'}
                variant="outline"
              >
                Back to Messages
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </MessagingErrorBoundary>
  );
}

/**
 * HOC for wrapping components with error boundary
 */
export function withMessagingErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <MessagingErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </MessagingErrorBoundary>
  );

  WrappedComponent.displayName = `withMessagingErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for error reporting from functional components
 */
export function useErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    console.error(`Messaging error${context ? ` in ${context}` : ''}:`, error);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error reporting service
      console.error('Production messaging error:', {
        message: error.message,
        stack: error.stack,
        context
      });
    }
  };

  return { reportError };
}
