
import { supabase } from '@/lib/supabase';
import { v5 as uuidv5 } from 'uuid';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

// Generate a proper UUID from a Google Books ID using UUID v5
// This ensures the same Google Books ID always produces the same valid UUID
export function generateBookUuid(googleBooksId: string): string {
  // Use UUID v5 with a namespace to create consistent UUIDs
  // We'll use a fixed namespace UUID (just for BookConnect application)
  const NAMESPACE = '85f520c1-fff4-4a1d-a543-8ce459b4bd91';
  return uuidv5(googleBooksId, NAMESPACE);
}

// Wrapper function for API calls with error handling
export async function apiCall<T>(
  promise: any, // Allow any type for flexibility with Supabase's return types
  errorMessage: string = 'An error occurred. Please try again later.'
): Promise<T | null> {
  try {
    const { data, error } = await promise;
    
    if (error) {
      console.error(error);
      toast.error(errorMessage);
      Sentry.captureException(error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error(err);
    toast.error(errorMessage);
    Sentry.captureException(err);
    return null;
  }
}

export { supabase };
