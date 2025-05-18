import { supabase } from '@/lib/supabase';
import { ConnectionState } from './types';

/**
 * Manages the connection state for real-time subscriptions
 */
class ConnectionManager {
  private connectionState: ConnectionState = 'DISCONNECTED';
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();
  
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
   * Handle connection status change
   * @param status New connection status
   */
  handleConnectionStatusChange(status: string): void {
    let newState: ConnectionState;

    switch (status) {
      case 'CONNECTED':
        newState = 'CONNECTED';
        break;
      case 'CONNECTING':
        newState = 'CONNECTING';
        break;
      case 'DISCONNECTED':
        newState = 'DISCONNECTED';
        break;
      default:
        newState = 'ERROR';
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
  notifyConnectionStateListeners(): void {
    for (const listener of this.connectionStateListeners) {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    }
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();
