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
