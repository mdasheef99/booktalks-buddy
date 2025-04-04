
import { supabase } from '@/lib/supabase';
import { v5 as uuidv5 } from 'uuid';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

// Map to store the relationship between UUIDs and original Google Books IDs
const uuidToGoogleIdMap = new Map<string, string>();
const googleIdToUuidMap = new Map<string, string>();

// Generate a proper UUID from a Google Books ID using UUID v5
// This ensures the same Google Books ID always produces the same valid UUID
export function generateBookUuid(googleBooksId: string): string {
  // Use UUID v5 with a namespace to create consistent UUIDs
  // We'll use a fixed namespace UUID (just for BookConnect application)
  const NAMESPACE = '85f520c1-fff4-4a1d-a543-8ce459b4bd91';
  const uuidResult = uuidv5(googleBooksId, NAMESPACE);

  console.log(`Generating UUID for Google Books ID: ${googleBooksId}, result: ${uuidResult}`);

  // Store the mapping between UUID and Google Books ID
  uuidToGoogleIdMap.set(uuidResult, googleBooksId);
  googleIdToUuidMap.set(googleBooksId, uuidResult);

  return uuidResult;
}

// Get the original Google Books ID from a UUID
export function getGoogleBooksIdFromUuid(uuid: string): string | undefined {
  return uuidToGoogleIdMap.get(uuid);
}

// Check if a string is a UUID
export function isUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Get the correct ID to use for book discussions
// If it's a UUID, try to get the original Google Books ID
// If it's not a UUID, assume it's already a Google Books ID
export function getBookDiscussionId(id: string): string {
  if (isUuid(id)) {
    const googleId = getGoogleBooksIdFromUuid(id);
    if (googleId) {
      console.log(`Converting UUID ${id} back to Google Books ID: ${googleId}`);
      return googleId;
    }
  }
  return id;
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
