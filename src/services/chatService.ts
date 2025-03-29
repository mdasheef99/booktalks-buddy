
import { apiCall, supabase } from '@/lib/supabase';

// Export ChatMessage type for use in other components
export interface ChatMessage {
  id: string;
  book_id: string;
  message: string;
  username: string;
  timestamp: string;
  user_id?: string;
  created_at: string; // Changed from optional to required to match usage
  read?: boolean;
}

// Create a helper function to generate a deterministic UUID from a Google Books ID
function generateBookUuid(googleBooksId: string): string {
  // Convert Google Books ID to a consistent UUID format
  // This uses a simple pattern to ensure the same Google Books ID always maps to the same UUID
  const normalizedId = googleBooksId.replace(/[^a-zA-Z0-9]/g, '');
  const segments = [
    normalizedId.substring(0, 8).padEnd(8, 'a'),
    normalizedId.substring(8, 12).padEnd(4, 'b'),
    '4' + normalizedId.substring(12, 15).padEnd(3, 'c'), // UUID v4 format
    '8' + normalizedId.substring(15, 18).padEnd(3, 'd'), // UUID v4 variant
    normalizedId.substring(18, 30).padEnd(12, 'e')
  ];
  return segments.join('-');
}

export async function getBookChat(bookId: string): Promise<ChatMessage[]> {
  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(bookId);
  
  const result = await apiCall<ChatMessage[]>(
    supabase
      .from('chat_messages')
      .select('*')
      .eq('book_id', dbBookId)
      .order('timestamp', { ascending: true }),
    'Failed to load chat messages'
  );
  return result || [];
}

export async function sendChatMessage(message: string, bookId: string, username: string, userId?: string): Promise<ChatMessage | null> {
  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(bookId);
  
  return await apiCall<ChatMessage>(
    supabase.from('chat_messages').insert([
      {
        message,
        book_id: dbBookId,
        username,
        timestamp: new Date().toISOString(),
        user_id: userId
      }
    ]).select().single(),
    'Failed to send message'
  );
}

export function subscribeToChat(
  bookId: string,
  callback: (message: ChatMessage) => void
) {
  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(bookId);
  
  return supabase
    .channel(`chat:${bookId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `book_id=eq.${dbBookId}`
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();
}
