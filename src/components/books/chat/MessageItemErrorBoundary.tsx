import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  messageId?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary for MessageItem components in anonymous chat
 * Prevents individual message rendering errors from crashing the entire chat
 */
class MessageItemErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MessageItem Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or use provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex justify-center mb-2">
          <div className="max-w-[75%] min-w-[150px] w-[300px]">
            <div className="relative px-3.5 py-2 rounded-2xl font-serif text-sm shadow-md bg-red-50 border border-red-200 text-red-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-xs font-medium">Message Error</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleRetry}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <RefreshCw size={12} />
                </Button>
              </div>
              <div className="text-xs opacity-80">
                Unable to display this message. This may be due to a temporary issue.
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-red-600">Debug Info</summary>
                  <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MessageItemErrorBoundary;
