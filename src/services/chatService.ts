
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
  created_at: string;
  read?: boolean;
  reply_to_id?: string;
  deleted_at?: string;
  reactions?: Array<{reaction: string, count: number, userReacted: boolean, username: string}>;
}

// Message reaction type
export interface MessageReactionData {
  id: string;
  message_id: string;
  username: string;
  reaction: string;
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
    
    // Process messages to include reactions
    const messages = data || [];
    const currentUsername = localStorage.getItem('anon_username') || 
                          localStorage.getItem('username') || 
                          'Anonymous Reader';
                          
    // Load reactions for each message
    const messagesWithReactions = await Promise.all(messages.map(async (message) => {
      try {
        const reactions = await getMessageReactions(message.id);
        return {
          ...message,
          reactions
        };
      } catch (e) {
        console.error("Error loading reactions for message:", message.id, e);
        return message;
      }
    }));
    
    return messagesWithReactions;
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
  userId?: string,
  replyToId?: string
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
      user_id: userId || null,
      reply_to_id: replyToId || null
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

export async function deleteMessage(
  messageId: string,
  forEveryone: boolean = true
): Promise<boolean> {
  try {
    if (forEveryone) {
      // Mark as deleted for everyone by setting deleted_at
      const { error } = await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);
        
      if (error) {
        console.error("Error deleting message:", error);
        throw error;
      }
      
      return true;
    }
    
    // For client-side only deletions, we don't need to do anything server-side
    return true;
  } catch (error) {
    console.error("Failed to delete message:", error);
    return false;
  }
}

export async function addReaction(
  messageId: string,
  username: string,
  reaction: string
): Promise<boolean> {
  try {
    // First check if user already reacted with this emoji
    const { data: existingReaction, error: checkError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('username', username)
      .eq('reaction', reaction)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking existing reaction:", checkError);
      throw checkError;
    }
    
    // If reaction already exists, remove it (toggle behavior)
    if (existingReaction) {
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);
        
      if (deleteError) {
        console.error("Error removing reaction:", deleteError);
        throw deleteError;
      }
      
      return true;
    }
    
    // Otherwise, add the reaction
    const { error: insertError } = await supabase
      .from('message_reactions')
      .insert([{
        message_id: messageId,
        username,
        reaction
      }]);
      
    if (insertError) {
      console.error("Error adding reaction:", insertError);
      throw insertError;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to add/toggle reaction:", error);
    return false;
  }
}

export async function getMessageReactions(messageId: string): Promise<Array<{reaction: string, count: number, userReacted: boolean, username: string}>> {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('reaction, username')
      .eq('message_id', messageId);
      
    if (error) {
      console.error("Error fetching reactions:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Group reactions and count them
    const reactionGroups: Record<string, {count: number, users: string[]}> = {};
    
    data.forEach((item) => {
      if (!reactionGroups[item.reaction]) {
        reactionGroups[item.reaction] = {
          count: 0,
          users: []
        };
      }
      
      reactionGroups[item.reaction].count++;
      reactionGroups[item.reaction].users.push(item.username);
    });
    
    // Get the current username to check if user reacted
    const currentUsername = localStorage.getItem('anon_username') || 
                           localStorage.getItem('username') || 
                           'Anonymous Reader';
    
    // Format the response
    return Object.keys(reactionGroups).map(reaction => ({
      reaction,
      count: reactionGroups[reaction].count,
      userReacted: reactionGroups[reaction].users.includes(currentUsername),
      username: reactionGroups[reaction].users[0] // Include the first username who reacted
    }));
  } catch (error) {
    console.error("Failed to get message reactions:", error);
    return [];
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
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `book_id=eq.${dbBookId}`
      },
      (payload) => {
        console.log("Received updated message:", payload);
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
}

export function subscribeToReactions(
  messageId: string,
  callback: (reaction: MessageReactionData) => void
) {
  console.log("Subscribing to reactions for messageId:", messageId);
  
  return supabase
    .channel(`reactions:${messageId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=eq.${messageId}`
      },
      (payload) => {
        console.log("Reaction change:", payload);
        if (payload.new) {
          callback(payload.new as MessageReactionData);
        } else if (payload.old) {
          callback(payload.old as MessageReactionData);
        }
      }
    )
    .subscribe((status) => {
      console.log("Reaction subscription status:", status);
    });
}
