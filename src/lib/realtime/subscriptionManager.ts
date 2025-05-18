import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  SubscriptionConfig,
  SubscriptionInfo,
  SubscriptionFilter,
  ConnectionState
} from './types';
import { connectionManager } from './connectionManager';
import { reconnectionHandler } from './reconnectionHandler';

/**
 * Manages real-time subscriptions to Supabase
 */
class SubscriptionManager {
  private subscriptions: Map<string, SubscriptionInfo> = new Map();

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
        reconnectionHandler.attemptReconnect(subscription, this.subscribe.bind(this));
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
    return connectionManager.getConnectionState();
  }

  /**
   * Add connection state listener
   * @param listener Connection state listener
   */
  addConnectionStateListener(listener: (state: ConnectionState) => void): void {
    connectionManager.addConnectionStateListener(listener);
  }

  /**
   * Remove connection state listener
   * @param listener Connection state listener
   */
  removeConnectionStateListener(listener: (state: ConnectionState) => void): void {
    connectionManager.removeConnectionStateListener(listener);
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
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();
