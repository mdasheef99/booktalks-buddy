import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

/**
 * Standard error handler for chat operations
 * @param error The error object
 * @param operation Description of the operation that failed
 * @param context Additional context for error reporting
 * @param customMessage Optional custom message to show to the user
 */
export function handleChatError(
  error: unknown,
  operation: string,
  context: Record<string, any> = {},
  customMessage?: string
) {
  // Log to console
  console.error(`Error during ${operation}:`, error);

  // Report to Sentry with context
  Sentry.captureException(error, {
    tags: { component: "ChatService", operation },
    extra: context
  });

  // Show user-friendly toast notification
  const defaultMessage = `Couldn't ${operation.toLowerCase()}. Please try again.`;
  toast.error(customMessage || defaultMessage, {
    id: `chat-error-${operation}`,
    duration: 4000,
  });

  return error;
}

/**
 * Standard error handler for club management operations
 * @param error The error object
 * @param operation Description of the operation that failed
 * @param context Additional context for error reporting
 * @param customMessage Optional custom message to show to the user
 */
export function handleClubError(
  error: unknown,
  operation: string,
  context: Record<string, any> = {},
  customMessage?: string
) {
  // Log to console
  console.error(`Error during ${operation}:`, error);

  // Report to Sentry with context
  Sentry.captureException(error, {
    tags: { component: "ClubManagement", operation },
    extra: context
  });

  // Determine appropriate error message based on error type
  let message = customMessage;
  if (!message) {
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Handle Supabase errors
      const supabaseError = error as any;
      if (supabaseError.code) {
        switch (supabaseError.code) {
          case '42P01': // Table doesn't exist
            message = 'This feature is not yet available. Please try again later.';
            break;
          case '23505': // Unique constraint violation
            message = 'This record already exists.';
            break;
          case '23503': // Foreign key constraint violation
            message = 'Invalid reference to a related record.';
            break;
          case '42501': // Permission denied
            message = 'You don\'t have permission to perform this action.';
            break;
          case 'PGRST116': // No rows returned
            message = 'The requested record was not found.';
            break;
          default:
            message = supabaseError.message || `An error occurred during ${operation}`;
        }
      } else {
        message = `An error occurred during ${operation}`;
      }
    } else {
      message = `An error occurred during ${operation}`;
    }
  }

  toast.error(message, {
    id: `club-error-${operation}`,
    duration: 4000,
  });

  return error;
}

/**
 * Determines if an error is related to network connectivity
 */
export function isNetworkError(error: any): boolean {
  // Check for common network error patterns
  if (!error) return false;

  // Check for fetch/network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  if (error.name === 'NetworkError') return true;
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('connection') ||
    error.message.includes('offline') ||
    error.message.includes('Failed to fetch')
  )) return true;

  // Check for Supabase connection errors
  if (error.code === 'PGRST301' || // Database connection error
      error.code === '20001' ||    // Realtime subscription error
      error.code === '20002') {    // Realtime connection error
    return true;
  }

  return false;
}

/**
 * Wrapper for async operations with standardized error handling
 * @param operation Function to execute
 * @param operationName Name of the operation for error reporting
 * @param context Additional context for error reporting
 * @param errorMessage Custom error message to show on failure
 * @param type Type of operation (chat or club)
 * @param fallbackValue Optional fallback value to return on error
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Record<string, any> = {},
  errorMessage?: string,
  type: 'chat' | 'club' = 'chat',
  fallbackValue: T | null = null
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (type === 'club') {
      handleClubError(error, operationName, context, errorMessage);
    } else {
      handleChatError(error, operationName, context, errorMessage);
    }
    return fallbackValue;
  }
}

/**
 * Wrapper for club management operations with standardized error handling
 * @param operation Function to execute
 * @param operationName Name of the operation for error reporting
 * @param context Additional context for error reporting
 * @param errorMessage Custom error message to show on failure
 * @param fallbackValue Optional fallback value to return on error
 */
export async function withClubErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Record<string, any> = {},
  errorMessage?: string,
  fallbackValue: T | null = null
): Promise<T | null> {
  return withErrorHandling(operation, operationName, context, errorMessage, 'club', fallbackValue);
}
