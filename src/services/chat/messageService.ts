import { supabase, generateBookUuid } from '../base/supabaseService';
import { ChatMessage } from './models';
import { ensureBookExists } from './bookService';

// ========== Chat Message Functions ==========
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

// ========== Reaction Functions ==========
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
