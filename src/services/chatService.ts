
import { apiCall, supabase, ChatMessage } from '@/lib/supabase';

export async function getBookChat(bookId: string): Promise<ChatMessage[]> {
  const data = await apiCall(
    supabase
      .from('chat_messages')
      .select('*')
      .eq('book_id', bookId)
      .order('timestamp', { ascending: true }),
    'Failed to load chat messages'
  );
  return data || [];
}

export async function sendChatMessage(message: string, bookId: string, username: string, userId?: string): Promise<ChatMessage | null> {
  return await apiCall(
    supabase.from('chat_messages').insert([
      {
        message,
        book_id: bookId,
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
  return supabase
    .channel(`chat:${bookId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `book_id=eq.${bookId}`
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();
}
