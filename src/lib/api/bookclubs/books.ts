import { supabase } from '../../supabase';
import { isClubAdmin } from '../auth';

/**
 * Book Club Current Book Management
 */

export interface CurrentBook {
  club_id: string;
  title: string;
  author: string;
  set_at: string;
  book_id?: string;
  nomination_id?: string;
  book?: {
    id: string;
    google_books_id: string;
    title: string;
    author: string;
    cover_url: string | null;
    description: string | null;
    genre: string | null;
  };
}

/**
 * Set the current book for a book club using a nomination
 * @param userId User ID
 * @param clubId Club ID
 * @param nominationId Nomination ID
 * @returns The updated current book
 */
export async function setCurrentBookFromNomination(userId: string, clubId: string, nominationId: string) {
  try {
    // Check if user is an admin of the club
    if (!(await isClubAdmin(userId, clubId))) {
      throw new Error('You must be an admin of the club to set the current book');
    }

    // Get the nomination details
    const { data: nomination, error: nominationError } = await supabase
      .from('book_nominations')
      .select('id, book_id, book:books(title, author)')
      .eq('id', nominationId)
      .eq('club_id', clubId) // Ensure the nomination belongs to this club
      .single();

    if (nominationError) {
      console.error('Error fetching nomination:', nominationError);
      throw new Error('Failed to find nomination');
    }

    // Update the current book
    const { error } = await supabase
      .from('current_books')
      .upsert([{
        club_id: clubId,
        book_id: nomination.book_id,
        nomination_id: nomination.id,
        title: nomination.book.title, // Keep these for backward compatibility
        author: nomination.book.author, // Keep these for backward compatibility
        set_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error setting current book:', error);
      throw new Error('Failed to set current book');
    }

    // Update the nomination status to 'selected'
    const { error: updateError } = await supabase
      .from('book_nominations')
      .update({ status: 'selected' })
      .eq('id', nominationId);

    if (updateError) {
      console.error('Error updating nomination status:', updateError);
      // Continue despite the error
    }

    return getCurrentBook(clubId);
  } catch (error) {
    console.error('Unexpected error setting current book:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to set current book');
  }
}

/**
 * Set the current book for a book club directly (legacy method)
 * @param userId User ID
 * @param clubId Club ID
 * @param book Book details
 * @returns The updated current book
 */
export async function setCurrentBook(userId: string, clubId: string, book: { title: string; author: string }) {
  if (!(await isClubAdmin(userId, clubId))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('current_books')
    .upsert([{
      club_id: clubId,
      title: book.title,
      author: book.author,
      set_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get the current book for a book club
 * @param clubId Club ID
 * @returns The current book with full details
 */
export async function getCurrentBook(clubId: string): Promise<CurrentBook | null> {
  console.log('Getting current book for club:', clubId);

  try {
    // Get the current book with book details
    const { data, error } = await supabase
      .from('current_books')
      .select(`
        club_id,
        title,
        author,
        set_at,
        book_id,
        nomination_id,
        book:books(id, google_books_id, title, author, cover_url, description, genre)
      `)
      .eq('club_id', clubId)
      .maybeSingle();

    if (error) {
      console.error('Error getting current book:', error);
      return null;
    }

    // If no current book is set, return null
    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error getting current book:', error);
    return null; // Return null instead of throwing to avoid breaking the UI
  }
}
