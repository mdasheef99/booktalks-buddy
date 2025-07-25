
import { supabase, generateBookUuid, getBookDiscussionId, isUuid } from '../base/supabaseService';
import { ChatMessage, MessageReactionData } from './models';

// Track online users in a book discussion
type PresencePayload = {
  username: string;
  lastActive: number;
};

// ========== Unified Channel Manager ==========
type SubscriptionState = 'CONNECTING' | 'SUBSCRIBED' | 'ERROR' | 'CLOSED';
type ChannelType = 'CHAT' | 'PRESENCE' | 'REACTIONS';

interface SubscriptionInfo {
  id: string;
  channelName: string;
  type: ChannelType;
  callbacks: Set<Function>;
  state: SubscriptionState;
  reconnectAttempts: number;
  lastConnected?: Date;
}

/**
 * Unified Channel Manager - StrictMode Safe
 * Handles all real-time subscriptions with proper deduplication
 */
class RealtimeChannelManager {
  private static instance: RealtimeChannelManager;
  private channels = new Map<string, any>();
  private subscriptions = new Map<string, SubscriptionInfo>();
  private subscriptionCounter = 0;

  static getInstance(): RealtimeChannelManager {
    if (!RealtimeChannelManager.instance) {
      RealtimeChannelManager.instance = new RealtimeChannelManager();
    }
    return RealtimeChannelManager.instance;
  }

  private constructor() {
    console.log('[ChannelManager] Initialized unified channel manager');
  }

  /**
   * Get or create a channel - StrictMode safe
   */
  getOrCreateChannel(channelName: string, type: ChannelType): any {
    const existingChannel = this.channels.get(channelName);
    if (existingChannel) {
      console.log(`[ChannelManager] Reusing existing ${type} channel:`, channelName);
      return existingChannel;
    }

    console.log(`[ChannelManager] Creating new ${type} channel:`, channelName);
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: channelName
        },
        broadcast: {
          self: false
        }
      }
    });
    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Add subscription callback - handles StrictMode double execution
   */
  addSubscription(
    channelName: string,
    type: ChannelType,
    callback: Function
  ): string {
    // Generate unique subscription ID
    const subscriptionId = `${type}_${channelName}_${++this.subscriptionCounter}`;

    // Check if we already have a subscription for this channel
    const existingSubscription = Array.from(this.subscriptions.values())
      .find(sub => sub.channelName === channelName && sub.type === type);

    if (existingSubscription && existingSubscription.state === 'SUBSCRIBED') {
      // Add callback to existing healthy subscription
      console.log(`[ChannelManager] Adding callback to existing ${type} subscription:`, channelName);
      existingSubscription.callbacks.add(callback);

      // Create new subscription record for this callback
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        channelName,
        type,
        callbacks: new Set([callback]),
        state: existingSubscription.state,
        reconnectAttempts: 0,
        lastConnected: existingSubscription.lastConnected
      });

      return subscriptionId;
    }

    // Create new subscription
    const subscription: SubscriptionInfo = {
      id: subscriptionId,
      channelName,
      type,
      callbacks: new Set([callback]),
      state: 'CONNECTING',
      reconnectAttempts: 0
    };

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`[ChannelManager] Created new ${type} subscription:`, subscriptionId);

    return subscriptionId;
  }

  /**
   * Remove subscription callback
   */
  removeSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      console.warn(`[ChannelManager] Subscription not found:`, subscriptionId);
      return;
    }

    console.log(`[ChannelManager] Removing ${subscription.type} subscription:`, subscriptionId);

    // Remove this specific subscription
    this.subscriptions.delete(subscriptionId);

    // Check if there are other subscriptions for the same channel
    const remainingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.channelName === subscription.channelName && sub.type === subscription.type);

    if (remainingSubscriptions.length === 0) {
      // No more subscriptions for this channel, clean it up
      console.log(`[ChannelManager] No more subscriptions, cleaning up channel:`, subscription.channelName);
      this.removeChannel(subscription.channelName);
    }
  }

  /**
   * Remove channel completely
   */
  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log('[ChannelManager] Removing channel:', channelName);
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('[ChannelManager] Error removing channel:', error);
      }
      this.channels.delete(channelName);
    }
  }

  /**
   * Get subscription info
   */
  getSubscription(subscriptionId: string): SubscriptionInfo | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Update subscription state
   */
  updateSubscriptionState(subscriptionId: string, state: SubscriptionState): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.state = state;
      if (state === 'SUBSCRIBED') {
        subscription.lastConnected = new Date();
        subscription.reconnectAttempts = 0;
      }
    }
  }

  /**
   * Get all callbacks for a channel
   */
  getChannelCallbacks(channelName: string, type: ChannelType): Set<Function> {
    const callbacks = new Set<Function>();

    this.subscriptions.forEach(subscription => {
      if (subscription.channelName === channelName && subscription.type === type) {
        subscription.callbacks.forEach(callback => callbacks.add(callback));
      }
    });

    return callbacks;
  }
}

// Global channel manager instance
const channelManager = RealtimeChannelManager.getInstance();

// Exponential backoff for reconnection attempts
function getReconnectDelay(attempts: number): number {
  return Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
}

export function subscribeToChat(
  bookId: string,
  callback: (message: ChatMessage) => void
): { unsubscribe: () => void } {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Convert Google Books ID to UUID format for Supabase
  const dbBookId = generateBookUuid(originalId);

  // Create unique channel name with sanitized ID to avoid conflicts with presence
  // Sanitize the Google Books ID to ensure WebSocket compatibility
  const sanitizedId = originalId.replace(/[^a-zA-Z0-9]/g, '_');
  const channelName = `chat_messages:${sanitizedId}`;

  console.log("[Chat] Subscribing to chat for bookId:", bookId, "original ID:", originalId, "sanitized:", sanitizedId, "converted to UUID:", dbBookId, "channel:", channelName);

  // Add subscription through unified channel manager (StrictMode safe)
  const subscriptionId = channelManager.addSubscription(channelName, 'CHAT', callback);

  // Get or create channel
  const channel = channelManager.getOrCreateChannel(channelName, 'CHAT');

  // Check if this is a new channel that needs setup
  const existingSubscription = channelManager.getSubscription(subscriptionId);
  if (!existingSubscription) {
    console.error("[Chat] Failed to create subscription:", subscriptionId);
    return { unsubscribe: () => {} };
  }

  // Only set up channel listeners if this is a new channel
  const allCallbacks = channelManager.getChannelCallbacks(channelName, 'CHAT');
  const isNewChannel = allCallbacks.size === 1; // Only our callback exists

  if (isNewChannel) {
    console.log("[Chat] Setting up new channel listeners for:", channelName);

    // Set up message listeners for new channel
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `book_id=eq.${dbBookId}`
        },
        (payload) => {
          const currentCallbacks = channelManager.getChannelCallbacks(channelName, 'CHAT');
          console.log("[Chat] Received new message:", payload, "broadcasting to", currentCallbacks.size, "callbacks");

          // Broadcast to ALL current callbacks
          currentCallbacks.forEach(cb => {
            try {
              cb(payload.new as ChatMessage);
            } catch (error) {
              console.error("[Chat] Error in message callback:", error);
            }
          });
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
          const currentCallbacks = channelManager.getChannelCallbacks(channelName, 'CHAT');
          console.log("[Chat] Received updated message:", payload, "broadcasting to", currentCallbacks.size, "callbacks");

          // Broadcast to ALL current callbacks
          currentCallbacks.forEach(cb => {
            try {
              cb(payload.new as ChatMessage);
            } catch (error) {
              console.error("[Chat] Error in message callback:", error);
            }
          });
        }
      )
      .subscribe((status: string) => {
        console.log("[Chat] Subscription status:", status, "for channel:", channelName);

        // Update subscription state through channel manager
        if (status === 'SUBSCRIBED') {
          channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');
          console.log("[Chat] Subscription successful for channel:", channelName);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          channelManager.updateSubscriptionState(subscriptionId, 'ERROR');
          console.error("[Chat] Subscription failed with status:", status, "for channel:", channelName);

          // Let Supabase handle reconnection automatically
          // The unified channel manager will handle cleanup if needed
        }
      });
  } else {
    console.log("[Chat] Reusing existing channel setup for:", channelName);
    // Update subscription state to subscribed since channel already exists
    channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');
  }

  // Return unsubscribe function for this specific subscription
  return {
    unsubscribe: () => {
      console.log("[Chat] Unsubscribing callback for channel:", channelName);
      channelManager.removeSubscription(subscriptionId);
    }
  };
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

// Track presence in a book discussion - StrictMode safe
export function trackPresence(
  bookId: string,
  username: string,
  onPresenceChange: (users: string[]) => void
): { unsubscribe: () => void } {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;

  // Create unique channel name for presence with sanitized ID
  // Sanitize the Google Books ID to ensure WebSocket compatibility
  const sanitizedId = originalId.replace(/[^a-zA-Z0-9]/g, '_');
  const channelName = `presence:${sanitizedId}`;

  console.log("[Presence] Setting up presence tracking for channel:", channelName, "user:", username, "original ID:", originalId, "sanitized:", sanitizedId);

  // Add subscription through unified channel manager (StrictMode safe)
  const subscriptionId = channelManager.addSubscription(channelName, 'PRESENCE', onPresenceChange);

  // Get or create channel
  const channel = channelManager.getOrCreateChannel(channelName, 'PRESENCE');

  // Check if this is a new channel that needs setup
  const existingSubscription = channelManager.getSubscription(subscriptionId);
  if (!existingSubscription) {
    console.error("[Presence] Failed to create subscription:", subscriptionId);
    return { unsubscribe: () => {} };
  }

  // Only set up channel listeners if this is a new channel
  const allCallbacks = channelManager.getChannelCallbacks(channelName, 'PRESENCE');
  const isNewChannel = allCallbacks.size === 1; // Only our callback exists

  if (isNewChannel) {
    console.log("[Presence] Setting up new presence channel listeners for:", channelName);

    // Set up presence handlers for new channel
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

        console.log("[Presence] Online users in discussion (sync):", onlineUsers);

        // Broadcast to ALL current callbacks
        const currentCallbacks = channelManager.getChannelCallbacks(channelName, 'PRESENCE');
        currentCallbacks.forEach(cb => {
          try {
            cb(onlineUsers);
          } catch (error) {
            console.error("[Presence] Error in presence callback:", error);
          }
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] User left:', key, leftPresences);
      });

    // Subscribe to the channel and track presence
    channel.subscribe(async (status: string) => {
      console.log('[Presence] Subscription status:', status, 'for channel:', channelName);

      // Update subscription state through channel manager
      if (status === 'SUBSCRIBED') {
        channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');
        console.log('[Presence] Subscribed to presence channel, tracking user:', username);

        // Track the user's presence
        const userStatus = {
          username: username,
          online_at: new Date().toISOString(),
        };

        try {
          await channel.track(userStatus);
          console.log('[Presence] User presence tracked successfully:', username);
        } catch (error) {
          console.error('[Presence] Error tracking user presence:', error);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        channelManager.updateSubscriptionState(subscriptionId, 'ERROR');
        console.error('[Presence] Subscription failed with status:', status, 'for channel:', channelName);

        // Let Supabase handle reconnection automatically
        // The unified channel manager will handle cleanup if needed
      }
    });
  } else {
    console.log('[Presence] Reusing existing presence channel setup for:', channelName);
    // Update subscription state to subscribed since channel already exists
    channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');

    // Track this user's presence on the existing channel (async operation)
    const userStatus = {
      username: username,
      online_at: new Date().toISOString(),
    };

    // Use Promise-based approach instead of await in non-async context
    channel.track(userStatus)
      .then(() => {
        console.log('[Presence] User presence tracked on existing channel:', username);
      })
      .catch((error: any) => {
        console.error('[Presence] Error tracking user presence on existing channel:', error);
      });
  }

  // Return unsubscribe function for this specific subscription
  return {
    unsubscribe: () => {
      console.log('[Presence] Unsubscribing callback for channel:', channelName);
      channelManager.removeSubscription(subscriptionId);
    }
  };
}
