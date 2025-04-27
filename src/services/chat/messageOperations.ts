
import { supabase, generateBookUuid, getBookDiscussionId, isUuid } from '../base/supabaseService';
import { ChatMessage } from './models';
import { ensureBookExists } from './bookService';
import { getMessageReactions } from './reactions';

// ========== Chat Message Functions ==========
export async function getBookChat(bookId: string): Promise<ChatMessage[]> {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(originalId);

  console.log("Fetching chat for bookId:", bookId, "original ID:", originalId, "converted to UUID:", dbBookId);

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

import { handleChatError, isNetworkError } from '@/lib/errorHandling';

export async function sendChatMessage(
  message: string,
  bookId: string,
  username: string,
  title?: string,
  author?: string,
  userId?: string,
  replyToId?: string,
  coverUrl?: string
): Promise<ChatMessage | null> {
  if (!message.trim() || !bookId || !username) {
    console.error("Missing required fields for sending message");
    handleChatError(
      new Error("Missing required fields"),
      "Send Message",
      { bookId, username, messageLength: message?.length || 0 }
    );
    return null;
  }

  try {
    // Ensure we're using the original Google Books ID
    const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

    // Ensure the book exists in the database (solves foreign key constraint issue)
    // Now passing coverUrl to ensure it gets stored
    const dbBookId = await ensureBookExists(originalId, title || 'Unknown Book', author || 'Unknown Author', coverUrl);

    console.log("Sending message for bookId:", bookId, "original ID:", originalId, "converted to UUID:", dbBookId);

    const timestamp = new Date().toISOString();

    const newMessage = {
      message: message.trim(),
      book_id: dbBookId,
      username,
      timestamp,
      user_id: userId || null,
      reply_to_id: replyToId || null,
      // Add a status field to track message state
      status: 'sending'
    };

    console.log("Inserting message:", newMessage);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([newMessage])
      .select('*')
      .single();

    if (error) {
      console.error("Supabase error sending message:", error);

      // Check if it's a network error
      if (isNetworkError(error)) {
        handleChatError(
          error,
          "Send Message",
          { bookId, username },
          "Network error. Your message will be retried when connection is restored."
        );
      } else {
        handleChatError(
          error,
          "Send Message",
          { bookId, username, message: message.substring(0, 50) + (message.length > 50 ? '...' : '') }
        );
      }

      throw error;
    }

    console.log("Message sent successfully, response:", data);
    return data;
  } catch (error) {
    // Don't handle the error here, just rethrow it
    // This allows the component to handle it appropriately
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
