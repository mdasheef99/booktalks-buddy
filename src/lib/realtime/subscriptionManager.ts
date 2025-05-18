import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define types for subscription options
export type SubscriptionTable = 'events' | 'event_participants' | 'event_notifications';
export type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
export type SubscriptionFilter = Record<string, string>;

export interface SubscriptionOptions {
  table: SubscriptionTable;
  event?: SubscriptionEvent;
  filter?: SubscriptionFilter;
  schema?: string;
}

export interface SubscriptionConfig extends SubscriptionOptions {
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
}

export interface SubscriptionInfo {
  id: string;
  channel: RealtimeChannel;
  config: SubscriptionConfig;
  status: 'SUBSCRIBED' | 'PENDING' | 'ERROR' | 'UNSUBSCRIBED';
  error?: Error;
}

// Connection state management
export type ConnectionState = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';

class SubscriptionManager {
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private connectionState: ConnectionState = 'DISCONNECTED';
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2 seconds

  constructor() {
    // Initialize connection state listener
    supabase.channel('system')
      .on(
        'presence',
        { event: 'sync' },
        () => {
          // This is a workaround to detect connection status
          // The actual status will be handled in the status callback
        }
      )
      .on(
        'broadcast',
        { event: 'connection_status' },
        (status) => {
          if (status.payload && typeof status.payload.status === 'string') {
            this.handleConnectionStatusChange(status.payload.status);
          }
        }
      )
      .subscribe((status) => {
        // Handle subscription status
        if (status === 'SUBSCRIBED') {
          this.connectionState = 'CONNECTED';
          this.notifyConnectionStateListeners();
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionState = 'ERROR';
          this.notifyConnectionStateListeners();
        } else if (status === 'TIMED_OUT') {
          this.connectionState = 'DISCONNECTED';
          this.notifyConnectionStateListeners();
        }
      });
  }

  /**
   * Subscribe to real-time changes
   * @param config Subscription configuration
   * @returns Subscription ID
   */
  subscribe(config: SubscriptionConfig): string {
    const id = this.generateSubscriptionId(config);

    // Check if subscription already exists
    if (this.subscriptions.has(id)) {
      console.warn(`Subscription already exists: ${id}`);
      return id;
    }

    // Create channel
    const channel = supabase.channel(`realtime:${id}`);

    // Add postgres changes listener
    channel.on(
      'postgres_changes' as any, // Type assertion to bypass TypeScript error
      {
        event: config.event || '*',
        schema: config.schema || 'public',
        table: config.table,
        ...(config.filter && Object.keys(config.filter).length > 0 ? { filter: this.buildFilter(config.filter) } : {})
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        try {
          config.callback(payload);
        } catch (error) {
          console.error(`Error in subscription callback for ${id}:`, error);
          if (config.onError) {
            config.onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    );

    // Subscribe to channel
    const subscription: SubscriptionInfo = {
      id,
      channel,
      config,
      status: 'PENDING'
    };

    // Store subscription
    this.subscriptions.set(id, subscription);

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.updateSubscriptionStatus(id, 'SUBSCRIBED');
      } else if (status === 'CHANNEL_ERROR') {
        this.updateSubscriptionStatus(id, 'ERROR', new Error(`Channel error for ${id}`));
        if (config.onError) {
          config.onError(new Error(`Channel error for ${id}`));
        }
      } else if (status === 'TIMED_OUT') {
        this.updateSubscriptionStatus(id, 'ERROR', new Error(`Subscription timed out for ${id}`));
        if (config.onError) {
          config.onError(new Error(`Subscription timed out for ${id}`));
        }
        this.attemptReconnect(id);
      }
    });

    return id;
  }

  /**
   * Unsubscribe from a subscription
   * @param id Subscription ID
   * @returns Success status
   */
  unsubscribe(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      console.warn(`Subscription not found: ${id}`);
      return false;
    }

    // Unsubscribe from channel
    supabase.removeChannel(subscription.channel);

    // Update status
    subscription.status = 'UNSUBSCRIBED';

    // Remove subscription
    this.subscriptions.delete(id);

    return true;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const id of this.subscriptions.keys()) {
      this.unsubscribe(id);
    }
  }

  /**
   * Get subscription status
   * @param id Subscription ID
   * @returns Subscription status
   */
  getStatus(id: string): SubscriptionInfo['status'] | null {
    const subscription = this.subscriptions.get(id);
    return subscription ? subscription.status : null;
  }

  /**
   * Get connection state
   * @returns Connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Add connection state listener
   * @param listener Connection state listener
   */
  addConnectionStateListener(listener: (state: ConnectionState) => void): void {
    this.connectionStateListeners.add(listener);
    // Immediately notify the listener of the current state
    listener(this.connectionState);
  }

  /**
   * Remove connection state listener
   * @param listener Connection state listener
   */
  removeConnectionStateListener(listener: (state: ConnectionState) => void): void {
    this.connectionStateListeners.delete(listener);
  }

  /**
   * Generate a unique subscription ID
   * @param config Subscription configuration
   * @returns Subscription ID
   */
  private generateSubscriptionId(config: SubscriptionConfig): string {
    const { table, event = '*', filter = {} } = config;
    const filterStr = Object.entries(filter)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return `${table}:${event}${filterStr ? `:${filterStr}` : ''}`;
  }

  /**
   * Build filter for Supabase real-time subscription
   * @param filter Filter object
   * @returns Filter string
   */
  private buildFilter(filter: SubscriptionFilter): string {
    return Object.entries(filter)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join(',');
  }

  /**
   * Update subscription status
   * @param id Subscription ID
   * @param status New status
   * @param error Optional error
   */
  private updateSubscriptionStatus(id: string, status: SubscriptionInfo['status'], error?: Error): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.status = status;
      subscription.error = error;
    }
  }

  /**
   * Handle connection status change
   * @param status New connection status
   */
  private handleConnectionStatusChange(status: string): void {
    let newState: ConnectionState;

    switch (status) {
      case 'CONNECTED':
        newState = 'CONNECTED';
        this.reconnectAttempts = 0;
        this.reconnectDelay = 2000;
        break;
      case 'CONNECTING':
        newState = 'CONNECTING';
        break;
      case 'DISCONNECTED':
        newState = 'DISCONNECTED';
        this.attemptReconnectAll();
        break;
      default:
        newState = 'ERROR';
        this.attemptReconnectAll();
        break;
    }

    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.notifyConnectionStateListeners();
    }
  }

  /**
   * Notify all connection state listeners
   */
  private notifyConnectionStateListeners(): void {
    for (const listener of this.connectionStateListeners) {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    }
  }

  /**
   * Attempt to reconnect a subscription
   * @param id Subscription ID
   */
  private attemptReconnect(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription || subscription.status !== 'ERROR') {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${id}`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    setTimeout(() => {
      // Unsubscribe and resubscribe
      supabase.removeChannel(subscription.channel);

      // Create new subscription with same config
      this.subscribe(subscription.config);

      // Notify onReconnect callback
      if (subscription.config.onReconnect) {
        subscription.config.onReconnect();
      }
    }, delay);
  }

  /**
   * Attempt to reconnect all subscriptions
   */
  private attemptReconnectAll(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      for (const [id, subscription] of this.subscriptions.entries()) {
        if (subscription.status === 'ERROR') {
          this.attemptReconnect(id);
        }
      }
    }, this.reconnectDelay);
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();
