import { supabase } from '../../supabase';
import { isClubAdmin } from '../auth';

/**
 * Book Club Current Book Management
 */

/**
 * Set the current book for a book club
 */
export async function setCurrentBook(userId: string, clubId: string, book: { title: string; author: string }) {
  if (!(await isClubAdmin(userId, clubId))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('current_books')
    .upsert([{ club_id: clubId, title: book.title, author: book.author, set_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get the current book for a book club
 */
export async function getCurrentBook(clubId: string) {
  console.log('Getting current book for club:', clubId);

  try {
    // First check if the current_books table exists and has the expected structure
    const { error: tableError } = await supabase
      .from('current_books')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('Error checking current_books table:', tableError);
      // Return null instead of throwing an error
      return null;
    }

    // Now try to get the current book
    const { data, error } = await supabase
      .from('current_books')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record exists

    if (error) {
      console.error('Error getting current book:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error getting current book:', error);
    return null; // Return null instead of throwing to avoid breaking the UI
  }
}
