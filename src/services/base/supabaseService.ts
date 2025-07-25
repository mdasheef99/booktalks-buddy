
import { supabase } from '@/lib/supabase';
import { v5 as uuidv5 } from 'uuid';
import { toast } from 'sonner';

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
// If it's a UUID, try to get the original Google Books ID from memory first, then database
// If it's not a UUID, assume it's already a Google Books ID
export function getBookDiscussionId(id: string): string {
  if (isUuid(id)) {
    // First try memory map for performance
    const googleId = getGoogleBooksIdFromUuid(id);
    if (googleId) {
      console.log(`Converting UUID ${id} back to Google Books ID from memory: ${googleId}`);
      return googleId;
    }

    // If not in memory, we'll need to query the database
    // For now, return the UUID and let the async version handle database lookup
    console.log(`UUID ${id} not found in memory map, returning UUID for now`);
  }
  return id;
}

// Async version that can query the database for the Google Books ID
export async function getBookDiscussionIdAsync(id: string): Promise<string> {
  if (isUuid(id)) {
    // First try memory map for performance
    const googleId = getGoogleBooksIdFromUuid(id);
    if (googleId) {
      console.log(`Converting UUID ${id} back to Google Books ID from memory: ${googleId}`);
      return googleId;
    }

    // Query database for the original Google Books ID
    try {
      const { data, error } = await supabase
        .from('books')
        .select('google_books_id, title, author')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error querying database for UUID ${id}:`, error);
        return id;
      }

      if (data?.google_books_id) {
        // Update memory map for future use
        uuidToGoogleIdMap.set(id, data.google_books_id);
        googleIdToUuidMap.set(data.google_books_id, id);
        return data.google_books_id;
      } else if (data) {
        // If google_books_id is null/empty, create a synthetic ID based on title and author
        // This handles legacy data that was created without google_books_id
        const syntheticId = `${data.title}_${data.author}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        // Update memory map for future use
        uuidToGoogleIdMap.set(id, syntheticId);
        googleIdToUuidMap.set(syntheticId, id);
        return syntheticId;
      }
    } catch (error) {
      console.error(`Error fetching Google Books ID for UUID ${id}:`, error);
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
      return null;
    }

    return data;
  } catch (err) {
    console.error(err);
    toast.error(errorMessage);
    return null;
  }
}

export { supabase };
