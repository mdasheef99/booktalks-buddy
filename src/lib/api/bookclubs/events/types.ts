import { Database } from '@/integrations/supabase/types';

/**
 * Type definitions for events
 */
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
