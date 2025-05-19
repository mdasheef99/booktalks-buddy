import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wifi, ShieldAlert, FileQuestion, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ErrorType = 'connection' | 'permission' | 'notFound' | 'validation' | 'unknown';

interface ErrorDisplayProps {
  /**
   * The type of error to display
   */
  type?: ErrorType;
  /**
   * The error message to display
   */
  message: string;
  /**
   * Optional detailed error message
   */
  details?: string;
  /**
   * Function to retry the operation
   */
  onRetry?: () => void;
  /**
   * Function to go back or cancel
   */
  onBack?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * A component that displays different types of errors with appropriate icons and actions
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'unknown',
  message,
  details,
  onRetry,
  onBack,
  className
}) => {
  // Define error configurations based on type
  const errorConfig = {
    connection: {
      icon: <Wifi className="h-8 w-8 text-red-500" />,
      title: 'Connection Error',
      description: 'We couldn\'t connect to the server. Please check your internet connection.',
      retryLabel: 'Try Again',
      backLabel: 'Cancel',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    permission: {
      icon: <ShieldAlert className="h-8 w-8 text-amber-500" />,
      title: 'Permission Denied',
      description: 'You don\'t have permission to perform this action.',
      retryLabel: 'Refresh',
      backLabel: 'Go Back',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    notFound: {
      icon: <FileQuestion className="h-8 w-8 text-blue-500" />,
      title: 'Not Found',
      description: 'The requested resource could not be found.',
      retryLabel: 'Refresh',
      backLabel: 'Go Back',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    validation: {
      icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      title: 'Validation Error',
      description: 'There was a problem with the data you provided.',
      retryLabel: 'Try Again',
      backLabel: 'Cancel',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    unknown: {
      icon: <AlertCircle className="h-8 w-8 text-red-500" />,
      title: 'Error',
      description: 'An unexpected error occurred.',
      retryLabel: 'Try Again',
      backLabel: 'Cancel',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  };

  const config = errorConfig[type];

  // Log the error to console for debugging
  React.useEffect(() => {
    console.error(`Error (${type}):`, message, details || '');
  }, [type, message, details]);

  return (
    <Card 
      className={cn(
        "p-6 animate-fade-in border-2",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex flex-col items-center text-center">
        {config.icon}
        <h3 className={cn("text-lg font-medium mt-4", config.color)}>{config.title}</h3>
        <p className="mt-2 text-gray-600">{message || config.description}</p>
        
        {details && (
          <div className="mt-2 p-3 bg-white/50 rounded text-sm text-gray-600 max-w-full overflow-auto">
            {details}
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="flex items-center gap-2 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              {config.retryLabel}
            </Button>
          )}
          
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="transition-all duration-300"
            >
              {config.backLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ErrorDisplay;
