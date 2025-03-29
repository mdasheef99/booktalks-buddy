
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

// Create a book record if it doesn't exist yet - this helps solve the foreign key constraint issue
async function ensureBookExists(googleBooksId: string, title: string, author: string): Promise<string> {
  const dbBookId = generateBookUuid(googleBooksId);
  
  console.log("Ensuring book exists in database:", googleBooksId, "with UUID:", dbBookId);
  
  // Check if book exists
  const { data: existingBook, error: checkError } = await supabase
    .from('books')
    .select('id')
    .eq('id', dbBookId)
    .single();
    
  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking if book exists:", checkError);
  }
  
  // If book doesn't exist, create it
  if (!existingBook) {
    console.log("Book doesn't exist, creating:", title, "by", author);
    
    const { error: insertError } = await supabase
      .from('books')
      .insert([
        {
          id: dbBookId,
          title: title || 'Unknown Book',
          author: author || 'Unknown Author',
          genre: 'Uncategorized', // Required field
          cover_url: null
        }
      ]);
      
    if (insertError) {
      console.error("Error creating book record:", insertError);
      throw insertError;
    }
    
    console.log("Book created successfully with ID:", dbBookId);
  } else {
    console.log("Book already exists in database with ID:", dbBookId);
  }
  
  return dbBookId;
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

export async function sendChatMessage(
  message: string, 
  bookId: string, 
  username: string, 
  title?: string, 
  author?: string, 
  userId?: string
): Promise<ChatMessage | null> {
  if (!message.trim() || !bookId || !username) {
    console.error("Missing required fields for sending message");
    return null;
  }
  
  try {
    // Ensure the book exists in the database (solves foreign key constraint issue)
    const dbBookId = await ensureBookExists(bookId, title || 'Unknown Book', author || 'Unknown Author');
    
    console.log("Sending message for bookId:", bookId, "converted to UUID:", dbBookId);
    
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
