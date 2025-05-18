import { supabase } from '@/lib/supabase';
import { SubscriptionInfo, SubscriptionConfig } from './types';

/**
 * Handles reconnection logic for real-time subscriptions
 */
class ReconnectionHandler {
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2 seconds

  /**
   * Reset reconnection state
   */
  resetReconnectionState(): void {
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2000;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Attempt to reconnect a subscription
   * @param subscription Subscription info
   * @param subscribeCallback Function to resubscribe
   */
  attemptReconnect(
    subscription: SubscriptionInfo,
    subscribeCallback: (config: SubscriptionConfig) => string
  ): void {
    if (subscription.status !== 'ERROR') {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${subscription.id}`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    setTimeout(() => {
      // Unsubscribe and resubscribe
      supabase.removeChannel(subscription.channel);

      // Create new subscription with same config
      subscribeCallback(subscription.config);

      // Notify onReconnect callback
      if (subscription.config.onReconnect) {
        subscription.config.onReconnect();
      }
    }, delay);
  }

  /**
   * Attempt to reconnect all subscriptions
   * @param subscriptions Map of subscriptions
   * @param subscribeCallback Function to resubscribe
   */
  attemptReconnectAll(
    subscriptions: Map<string, SubscriptionInfo>,
    subscribeCallback: (config: SubscriptionConfig) => string
  ): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      for (const [id, subscription] of subscriptions.entries()) {
        if (subscription.status === 'ERROR') {
          this.attemptReconnect(subscription, subscribeCallback);
        }
      }
    }, this.reconnectDelay);
  }
}

// Export singleton instance
export const reconnectionHandler = new ReconnectionHandler();
