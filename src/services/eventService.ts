
import { apiCall, supabase, Event } from '@/lib/supabase';

export async function getEvents(): Promise<Event[]> {
  const result = await apiCall(
    supabase.from('events').select('*').order('date'),
    'Failed to load events'
  );
  return result || [];
}

export async function getEventById(id: string): Promise<Event | null> {
  return await apiCall(
    supabase.from('events').select('*').eq('id', id).single(),
    'Failed to load event details'
  );
}
