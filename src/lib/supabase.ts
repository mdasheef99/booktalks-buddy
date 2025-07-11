
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Supabase types based on our schema
export type Book = Database['public']['Tables']['books']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

// Export the supabase client from the integrated client
export const supabase = supabaseClient;

// Wrapper function for API calls with error handling
export async function apiCall<T>(
  promise: any, // Allow any type for flexibility with Supabase's return types
  errorMessage: string = 'An error occurred. Please try again later.'
): Promise<T | null> {
  try {
    const { data, error } = await promise;

    if (error) {
      console.error(error);
      toast.error(errorMessage);
      return null;
    }

    return data;
  } catch (err) {
    console.error(err);
    toast.error(errorMessage);
    return null;
  }
}
