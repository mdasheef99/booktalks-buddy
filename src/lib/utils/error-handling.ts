import { toast } from 'sonner';

/**
 * Standard error types for the application
 */
export enum ErrorType {
  FETCH = 'FETCH',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Standard error interface
 */
export interface StandardError {
  type: ErrorType;
  message: string;
  description?: string;
  originalError?: Error;
  recoveryAction?: () => void;
}

/**
 * Create a standard error object
 * @param type Error type
 * @param message Error message
 * @param description Optional detailed description
 * @param originalError Optional original error
 * @param recoveryAction Optional recovery action
 * @returns StandardError object
 */
export function createStandardError(
  type: ErrorType,
  message: string,
  description?: string,
  originalError?: Error,
  recoveryAction?: () => void
): StandardError {
  return {
    type,
    message,
    description,
    originalError,
    recoveryAction
  };
}

/**
 * Handle an error with standardized logging and user feedback
 * @param error The error to handle
 * @param context Optional context information
 * @param silent Optional flag to suppress toast notifications
 */
export function handleError(
  error: Error | StandardError | unknown,
  context?: string,
  silent: boolean = false
): StandardError {
  // Convert to standard error if needed
  const standardError = normalizeError(error);
  
  // Log the error
  console.error(
    `Error${context ? ` in ${context}` : ''}:`,
    standardError.message,
    standardError.originalError || standardError
  );
  
  // Show toast notification if not silent
  if (!silent) {
    showErrorToast(standardError);
  }
  
  return standardError;
}

/**
 * Convert any error to a StandardError
 * @param error The error to normalize
 * @returns StandardError
 */
function normalizeError(error: Error | StandardError | unknown): StandardError {
  // If already a StandardError, return as is
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as StandardError;
  }
  
  // If it's a regular Error
  if (error instanceof Error) {
    // Try to determine the error type from the message
    let type = ErrorType.UNKNOWN;
    
    if (error.message.includes('permission') || error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      type = ErrorType.PERMISSION;
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      type = ErrorType.NOT_FOUND;
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      type = ErrorType.VALIDATION;
    } else if (error.message.includes('network') || error.message.includes('connection')) {
      type = ErrorType.NETWORK;
    } else if (error.message.includes('server') || error.message.includes('500')) {
      type = ErrorType.SERVER;
    }
    
    return {
      type,
      message: error.message,
      originalError: error
    };
  }
  
  // For unknown errors
  return {
    type: ErrorType.UNKNOWN,
    message: typeof error === 'string' ? error : 'An unknown error occurred',
    originalError: error instanceof Error ? error : undefined
  };
}

/**
 * Show a toast notification for an error
 * @param error The error to show
 */
function showErrorToast(error: StandardError): void {
  const toastOptions = {
    description: error.description || getDefaultDescription(error.type),
    duration: 5000,
    ...(error.recoveryAction ? {
      action: {
        label: getActionLabel(error.type),
        onClick: error.recoveryAction
      }
    } : {})
  };
  
  toast.error(error.message, toastOptions);
}

/**
 * Get default description based on error type
 * @param type Error type
 * @returns Default description
 */
function getDefaultDescription(type: ErrorType): string {
  switch (type) {
    case ErrorType.FETCH:
      return 'There was a problem retrieving the data. Please try again later.';
    case ErrorType.VALIDATION:
      return 'The provided information is invalid. Please check your inputs and try again.';
    case ErrorType.PERMISSION:
      return 'You do not have permission to perform this action.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource could not be found.';
    case ErrorType.SERVER:
      return 'There was a problem with the server. Please try again later.';
    case ErrorType.NETWORK:
      return 'There was a network issue. Please check your connection and try again.';
    case ErrorType.UNKNOWN:
    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
}

/**
 * Get action label based on error type
 * @param type Error type
 * @returns Action label
 */
function getActionLabel(type: ErrorType): string {
  switch (type) {
    case ErrorType.FETCH:
    case ErrorType.SERVER:
    case ErrorType.NETWORK:
      return 'Retry';
    case ErrorType.VALIDATION:
      return 'Fix';
    case ErrorType.PERMISSION:
      return 'Details';
    case ErrorType.NOT_FOUND:
      return 'Go Back';
    case ErrorType.UNKNOWN:
    default:
      return 'Try Again';
  }
}
