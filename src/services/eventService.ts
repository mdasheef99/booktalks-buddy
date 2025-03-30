
import { supabase } from "@/lib/supabase";
import { Event } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Fetches all events from the database, sorted by date
 */
export const getEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getEvents:", error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

/**
 * Creates a new event in the database
 */
export const createEvent = async (eventData: {
  title: string;
  date: string;
  description: string;
  id?: string;
  created_at?: string;
}): Promise<Event | null> => {
  console.log("Creating event with data:", eventData);
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
      return null;
    }
    
    console.log("Event created successfully:", data);
    toast.success("Event created successfully");
    return data;
  } catch (error) {
    console.error("Error in createEvent:", error);
    toast.error("An unexpected error occurred");
    return null;
  }
};
