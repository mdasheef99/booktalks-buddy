
import { supabase } from '@/lib/supabase';
import { v5 as uuidv5 } from 'uuid';

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

// Generate a proper UUID from a Google Books ID using UUID v5
// This ensures the same Google Books ID always produces the same valid UUID
function generateBookUuid(googleBooksId: string): string {
  // Use UUID v5 with a namespace to create consistent UUIDs
  // We'll use a fixed namespace UUID (just for BookConnect application)
  const NAMESPACE = '85f520c1-fff4-4a1d-a543-8ce459b4bd91';
  return uuidv5(googleBooksId, NAMESPACE);
}

export async function getBookChat(bookId: string): Promise<ChatMessage[]> {
  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(bookId);
  
  console.log("Fetching chat for bookId:", bookId, "converted to UUID:", dbBookId);
  
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('book_id', dbBookId)
      .order('timestamp', { ascending: true })
      .limit(50); // Limiting to 50 messages initially as per requirement
      
    if (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
    
    console.log("Retrieved messages:", data);
    return data || [];
  } catch (error) {
    console.error("Failed to load chat messages:", error);
    return [];
  }
}

export async function sendChatMessage(message: string, bookId: string, username: string, userId?: string): Promise<ChatMessage | null> {
  if (!message.trim() || !bookId || !username) {
    console.error("Missing required fields for sending message");
    return null;
  }
  
  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(bookId);
  
  console.log("Sending message for bookId:", bookId, "converted to UUID:", dbBookId);
  
  try {
    const timestamp = new Date().toISOString();
    
    const newMessage = {
      message: message.trim(),
      book_id: dbBookId,
      username,
      timestamp,
      user_id: userId || null
    };
    
    console.log("Inserting message:", newMessage);
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([newMessage])
      .select('*')
      .single();
      
    if (error) {
      console.error("Supabase error sending message:", error);
      throw error;
    }
    
    console.log("Message sent successfully, response:", data);
    return data;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
}

export function subscribeToChat(
  bookId: string,
  callback: (message: ChatMessage) => void
) {
  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(bookId);
  
  console.log("Subscribing to chat for bookId:", bookId, "converted to UUID:", dbBookId);
  
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
        console.log("Received new message:", payload);
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
}
