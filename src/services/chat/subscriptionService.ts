
import { supabase, generateBookUuid, getBookDiscussionId, isUuid } from '../base/supabaseService';
import { ChatMessage, MessageReactionData } from './models';

// Track online users in a book discussion
type PresencePayload = {
  username: string;
  lastActive: number;
};

// ========== Subscription Functions ==========
export function subscribeToChat(
  bookId: string,
  callback: (message: ChatMessage) => void
) {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(originalId);

  console.log("Subscribing to chat for bookId:", bookId, "original ID:", originalId, "converted to UUID:", dbBookId);

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

// Track presence in a book discussion
export function trackPresence(
  bookId: string,
  username: string,
  onPresenceChange: (users: string[]) => void
) {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Create a presence channel for this book discussion
  const channel = supabase.channel(`presence:${originalId}`);

  // Set up presence handlers
  channel
    .on('presence', { event: 'sync' }, () => {
      // Get the current state of all online users
      const state = channel.presenceState();

      // Extract usernames from the presence state
      const onlineUsers: string[] = [];
      Object.values(state).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          if (presence.username) {
            onlineUsers.push(presence.username);
          }
        });
      });

      console.log("Online users in discussion (sync):", onlineUsers);
      onPresenceChange(onlineUsers);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    });

  // Subscribe to the channel and track presence
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Subscribed to presence channel, tracking user:', username);

      // Track the user's presence
      const userStatus = {
        username: username,
        online_at: new Date().toISOString(),
      };

      await channel.track(userStatus);
    }
  });

  // Return a function to leave the channel
  return {
    unsubscribe: async () => {
      console.log('Unsubscribing from presence channel');
      await channel.untrack();
      supabase.removeChannel(channel);
    }
  };
}
