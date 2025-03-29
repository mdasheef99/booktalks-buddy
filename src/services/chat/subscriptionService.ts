
import { supabase, generateBookUuid } from '../base/supabaseService';
import { ChatMessage, MessageReactionData } from './models';

// ========== Subscription Functions ==========
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
