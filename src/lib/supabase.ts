
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

// Supabase types based on our schema
export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  cover_url?: string;
  created_at?: string;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
  created_at?: string;
};

export type ChatMessage = {
  id: string;
  message: string;
  username: string;
  book_id: string;
  timestamp: string;
  user_id?: string;
  created_at?: string;
};

export type User = {
  id: string;
  email: string;
  username?: string;
  created_at?: string;
};

// Initialize Supabase client
// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Wrapper function for API calls with error handling
export async function apiCall<T>(
  promise: Promise<{ data: T | null; error: any }>,
  errorMessage: string = 'An error occurred. Please try again later.'
): Promise<T | null> {
  try {
    const { data, error } = await promise;
    
    if (error) {
      console.error(error);
      toast.error(errorMessage);
      Sentry.captureException(error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error(err);
    toast.error(errorMessage);
    Sentry.captureException(err);
    return null;
  }
}
