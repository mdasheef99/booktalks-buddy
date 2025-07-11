
import { supabase, generateBookUuid, getBookDiscussionId, isUuid } from '../base/supabaseService';
import { ChatMessage, MessageReactionData } from './models';

// Track online users in a book discussion
type PresencePayload = {
  username: string;
  lastActive: number;
};

// ========== Subscription Functions ==========
// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map<string, any>();

export function subscribeToChat(
  bookId: string,
  callback: (message: ChatMessage) => void
) {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(originalId);

  // Create unique channel name to avoid conflicts with presence
  const channelName = `chat_messages:${originalId}`;

  console.log("Subscribing to chat for bookId:", bookId, "original ID:", originalId, "converted to UUID:", dbBookId, "channel:", channelName);

  // Check if subscription already exists
  if (activeSubscriptions.has(channelName)) {
    console.log("Subscription already exists for channel:", channelName);
    const existingSubscription = activeSubscriptions.get(channelName);
    return existingSubscription;
  }

  const channel = supabase
    .channel(channelName)
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
      console.log("Chat subscription status:", status);
    });

  // Store the subscription
  activeSubscriptions.set(channelName, {
    unsubscribe: () => {
      console.log("Unsubscribing from chat channel:", channelName);
      activeSubscriptions.delete(channelName);
      channel.unsubscribe();
      supabase.removeChannel(channel);
    }
  });

  return activeSubscriptions.get(channelName);
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

// Track active presence subscriptions to prevent duplicates
const activePresenceSubscriptions = new Map<string, any>();

// Track presence in a book discussion
export function trackPresence(
  bookId: string,
  username: string,
  onPresenceChange: (users: string[]) => void
) {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Create unique channel name for presence
  const channelName = `presence:${originalId}`;

  console.log("Setting up presence tracking for channel:", channelName, "user:", username);

  // Check if presence subscription already exists
  if (activePresenceSubscriptions.has(channelName)) {
    console.log("Presence subscription already exists for channel:", channelName);
    const existingSubscription = activePresenceSubscriptions.get(channelName);
    return existingSubscription;
  }

  // Create a presence channel for this book discussion
  const channel = supabase.channel(channelName);

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

  // Store and return the subscription
  const subscription = {
    unsubscribe: async () => {
      console.log('Unsubscribing from presence channel:', channelName);
      activePresenceSubscriptions.delete(channelName);
      await channel.untrack();
      supabase.removeChannel(channel);
    }
  };

  activePresenceSubscriptions.set(channelName, subscription);
  return subscription;
}
