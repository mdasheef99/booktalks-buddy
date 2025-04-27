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
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Record<string, any> = {},
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleChatError(error, operationName, context, errorMessage);
    return null;
  }
}
