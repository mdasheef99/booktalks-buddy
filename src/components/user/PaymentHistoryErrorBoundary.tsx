/**
 * Payment History Error Boundary
 * 
 * Provides error handling and fallback UI for payment history components.
 * Ensures graceful degradation when payment history fails to load.
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PaymentHistoryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Payment History Error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Payment History Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">
                We're having trouble loading your payment history right now.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with payment history error boundary
 */
export function withPaymentHistoryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <PaymentHistoryErrorBoundary fallback={fallback}>
        <Component {...props} />
      </PaymentHistoryErrorBoundary>
    );
  };
}

/**
 * Simple error fallback for compact components
 */
export const CompactErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="text-center py-4 px-6 bg-red-50 border border-red-200 rounded-lg">
    <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
    <p className="text-sm text-red-600 mb-3">Payment history unavailable</p>
    {onRetry && (
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);
