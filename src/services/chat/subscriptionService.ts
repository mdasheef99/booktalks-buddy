
import { supabase, generateBookUuid, getBookDiscussionId, isUuid } from '../base/supabaseService';
import { ChatMessage, MessageReactionData } from './models';

// Track online users in a book discussion

// ========== Subscription Functions ==========
// Keep track of the last message received for each book to prevent duplicate updates
const lastMessageCache = new Map<string, { id: string, timestamp: string }>();

// Debounce function to prevent rapid updates
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function subscribeToChat(
  bookId: string,
  callback: (message: ChatMessage) => void
) {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(originalId);

  console.log("Subscribing to chat for bookId:", bookId, "original ID:", originalId, "converted to UUID:", dbBookId);

  // Create a debounced version of the callback to prevent rapid updates
  const debouncedCallback = debounce((message: ChatMessage) => {
    callback(message);
  }, 50); // 50ms debounce time

  // Function to process messages and prevent duplicates
  const processMessage = (payload: any) => {
    const message = payload.new as ChatMessage;

    // Check if we've already processed this message recently
    const cacheKey = `${bookId}:${message.id}`;
    const cachedMessage = lastMessageCache.get(cacheKey);

    if (cachedMessage &&
        cachedMessage.id === message.id &&
        cachedMessage.timestamp === message.timestamp) {
      console.log("Skipping duplicate message:", message.id);
      return;
    }

    // Update the cache
    lastMessageCache.set(cacheKey, {
      id: message.id,
      timestamp: message.timestamp
    });

    // Clean up old cache entries (keep cache size manageable)
    if (lastMessageCache.size > 100) {
      const keysToDelete = Array.from(lastMessageCache.keys()).slice(0, 50);
      keysToDelete.forEach(key => lastMessageCache.delete(key));
    }

    console.log("Processing message:", message.id);
    debouncedCallback(message);
  };

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
        console.log("Received new message:", payload.new.id);
        processMessage(payload);
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
        console.log("Received updated message:", payload.new.id);
        processMessage(payload);
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
}

// Optimize reaction updates with debouncing

export function subscribeToReactions(
  messageId: string,
  callback: (reaction: MessageReactionData) => void
) {
  console.log("Subscribing to reactions for messageId:", messageId);

  // Create a debounced version of the callback to prevent rapid updates
  const debouncedCallback = debounce((reaction: MessageReactionData) => {
    callback(reaction);
  }, 50); // 50ms debounce time

  // Function to process reactions and prevent duplicates
  const processReaction = (payload: any) => {
    const reaction = (payload.new || payload.old) as MessageReactionData;
    if (!reaction) return;

    // For reactions, we'll use a simpler approach since they don't have timestamps
    // We'll just batch updates that come in rapid succession
    debouncedCallback(reaction);
  };

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
        console.log("Reaction change:", payload.eventType);
        processReaction(payload);
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
