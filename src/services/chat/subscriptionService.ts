
import { supabase, generateBookUuid, getBookDiscussionId, isUuid } from '../base/supabaseService';
import { ChatMessage, MessageReactionData } from './models';

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

  private constructor() {}


  getOrCreateChannel(channelName: string): any {
    const existingChannel = this.channels.get(channelName);
    if (existingChannel) {
      return existingChannel;
    }
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
      existingSubscription.callbacks.add(callback);


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


    const subscription: SubscriptionInfo = {
      id: subscriptionId,
      channelName,
      type,
      callbacks: new Set([callback]),
      state: 'CONNECTING',
      reconnectAttempts: 0
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }


  removeSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }


    this.subscriptions.delete(subscriptionId);


    const remainingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.channelName === subscription.channelName && sub.type === subscription.type);

    if (remainingSubscriptions.length === 0) {
      this.removeChannel(subscription.channelName);
    }
  }


  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('[ChannelManager] Error removing channel:', error);
      }
      this.channels.delete(channelName);
    }
  }


  getSubscription(subscriptionId: string): SubscriptionInfo | undefined {
    return this.subscriptions.get(subscriptionId);
  }


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



export function subscribeToChat(
  bookId: string,
  callback: (message: ChatMessage) => void
): { unsubscribe: () => void } {
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;
  const dbBookId = generateBookUuid(originalId);
  const sanitizedId = originalId.replace(/[^a-zA-Z0-9]/g, '_');
  const channelName = `chat_messages:${sanitizedId}`;
  const subscriptionId = channelManager.addSubscription(channelName, 'CHAT', callback);
  const channel = channelManager.getOrCreateChannel(channelName);
  const existingSubscription = channelManager.getSubscription(subscriptionId);

  if (!existingSubscription) {
    return { unsubscribe: () => {} };
  }

  const allCallbacks = channelManager.getChannelCallbacks(channelName, 'CHAT');
  const isNewChannel = allCallbacks.size === 1;

  if (isNewChannel) {
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `book_id=eq.${dbBookId}`
        },
        (payload: any) => {
          const currentCallbacks = channelManager.getChannelCallbacks(channelName, 'CHAT');
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
        (payload: any) => {
          const currentCallbacks = channelManager.getChannelCallbacks(channelName, 'CHAT');
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
        if (status === 'SUBSCRIBED') {
          channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          channelManager.updateSubscriptionState(subscriptionId, 'ERROR');
        }
      });
  } else {
    channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');
  }

  return {
    unsubscribe: () => {
      channelManager.removeSubscription(subscriptionId);
    }
  };
}

export function subscribeToReactions(
  messageId: string,
  callback: (reaction: MessageReactionData) => void
) {
  return supabase
    .channel(`reactions:${messageId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=eq.${messageId}`
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as MessageReactionData);
        } else if (payload.old) {
          callback(payload.old as MessageReactionData);
        }
      }
    )
    .subscribe();
}

export function trackPresence(
  bookId: string,
  username: string,
  onPresenceChange: (users: string[]) => void
): { unsubscribe: () => void } {
  const originalId = isUuid(bookId) ? getBookDiscussionId(bookId) : bookId;
  const sanitizedId = originalId.replace(/[^a-zA-Z0-9]/g, '_');
  const channelName = `presence:${sanitizedId}`;

  const subscriptionId = channelManager.addSubscription(channelName, 'PRESENCE', onPresenceChange);
  const channel = channelManager.getOrCreateChannel(channelName);
  const existingSubscription = channelManager.getSubscription(subscriptionId);

  if (!existingSubscription) {
    return { unsubscribe: () => {} };
  }

  const allCallbacks = channelManager.getChannelCallbacks(channelName, 'PRESENCE');
  const isNewChannel = allCallbacks.size === 1;

  if (isNewChannel) {
    // Helper function to extract and update online users
    const updateOnlineUsers = (eventType: string = 'sync') => {
      const state = channel.presenceState();
      const onlineUsers: string[] = [];

      console.log(`[Presence] ${eventType} event - presence state:`, state);

      Object.values(state).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          if (presence.username) {
            onlineUsers.push(presence.username);
          }
        });
      });

      // Remove duplicates (in case of multiple presence entries for same user)
      const uniqueUsers = [...new Set(onlineUsers)];
      console.log(`[Presence] ${eventType} event - extracted users:`, uniqueUsers);

      const currentCallbacks = channelManager.getChannelCallbacks(channelName, 'PRESENCE');
      currentCallbacks.forEach(cb => {
        try {
          cb(uniqueUsers);
        } catch (error) {
          console.error("[Presence] Error in presence callback:", error);
        }
      });
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        updateOnlineUsers('sync');
      })
      .on('presence', { event: 'join' }, (payload: any) => {
        console.log('[Presence] User joined:', payload);
        updateOnlineUsers('join');
      })
      .on('presence', { event: 'leave' }, (payload: any) => {
        console.log('[Presence] User left:', payload);
        updateOnlineUsers('leave');
      });

    channel.subscribe(async (status: string) => {
      console.log(`[Presence] Channel subscription status: ${status} for user: ${username}`);

      if (status === 'SUBSCRIBED') {
        channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');
        const userStatus = {
          username: username,
          online_at: new Date().toISOString(),
        };

        try {
          await channel.track(userStatus);
          console.log(`[Presence] Successfully tracking user: ${username}`);

          // Validate presence after a short delay
          setTimeout(() => {
            const state = channel.presenceState();
            const hasCurrentUser = Object.values(state).some((presences: any) =>
              presences.some((p: any) => p.username === username)
            );

            if (!hasCurrentUser) {
              console.warn(`[Presence] User ${username} not found in presence state, retrying...`);
              channel.track(userStatus).catch((retryError: any) => {
                console.error('[Presence] Retry tracking failed:', retryError);
              });
            } else {
              console.log(`[Presence] User ${username} confirmed in presence state`);
            }
          }, 2000);

        } catch (error) {
          console.error('[Presence] Error tracking user presence:', error);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Presence] Channel error/timeout: ${status} for user: ${username}`);
        channelManager.updateSubscriptionState(subscriptionId, 'ERROR');
      }
    });
  } else {
    channelManager.updateSubscriptionState(subscriptionId, 'SUBSCRIBED');
    const userStatus = {
      username: username,
      online_at: new Date().toISOString(),
    };

    channel.track(userStatus)
      .catch((error: any) => {
        console.error('[Presence] Error tracking user presence on existing channel:', error);
      });
  }

  return {
    unsubscribe: () => {
      channelManager.removeSubscription(subscriptionId);
    }
  };
}
