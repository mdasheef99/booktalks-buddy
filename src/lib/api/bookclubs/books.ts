import { supabase } from '../../supabase';
import { getUserEntitlements } from '../../entitlements/cache';
import { canManageClub } from '../../entitlements/permissions';

/**
 * Book Club Current Book Management
 */

/**
 * Validate that only one current book exists per club
 * @param clubId Club ID to validate
 * @returns Promise<boolean> - true if validation passes
 */
async function validateSingleCurrentBook(clubId: string): Promise<boolean> {
  try {
    const { data, error, count } = await supabase
      .from('current_books')
      .select('club_id', { count: 'exact' })
      .eq('club_id', clubId);

    if (error) {
      console.error('Error validating current book constraint:', error);
      return false;
    }

    const bookCount = count || 0;
    if (bookCount > 1) {
      console.error(`❌ Data integrity violation: Club ${clubId} has ${bookCount} current books, expected 0 or 1`);

      // Auto-fix by keeping only the most recent one
      const { data: allBooks, error: fetchError } = await supabase
        .from('current_books')
        .select('*')
        .eq('club_id', clubId)
        .order('set_at', { ascending: false });

      if (!fetchError && allBooks && allBooks.length > 1) {
        const mostRecent = allBooks[0];
        const toDelete = allBooks.slice(1);

        console.log(`🔧 Auto-fixing: Keeping most recent book (${mostRecent.title}) and removing ${toDelete.length} duplicates`);

        for (const book of toDelete) {
          await supabase
            .from('current_books')
            .delete()
            .eq('club_id', clubId)
            .eq('set_at', book.set_at);
        }
      }

      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error validating current book constraint:', error);
    return false;
  }
}

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
    // Get user entitlements and check club management permission
    const entitlements = await getUserEntitlements(userId);

    // Get club's store ID for contextual permission checking
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();

    if (clubError) {
      console.error('Error fetching club store ID:', clubError);
      throw new Error('Failed to verify club permissions');
    }

    const canManage = canManageClub(entitlements, clubId, club.store_id);

    if (!canManage) {
      console.log('🚨 [setCurrentBookFromNomination] permission check failed for user:', userId);
      console.log('📍 Club ID:', clubId);
      console.log('🔑 User entitlements:', entitlements);
      throw new Error('Unauthorized: Only club administrators can set the current book');
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

    // Ensure only one current book per club by using explicit delete + insert transaction
    const { error: deleteError } = await supabase
      .from('current_books')
      .delete()
      .eq('club_id', clubId);

    if (deleteError) {
      console.error('Error removing existing current book:', deleteError);
      throw new Error('Failed to remove existing current book');
    }

    // Insert the new current book
    const { error: insertError } = await supabase
      .from('current_books')
      .insert([{
        club_id: clubId,
        book_id: nomination.book_id,
        nomination_id: nomination.id,
        title: nomination.book.title, // Keep these for backward compatibility
        author: nomination.book.author, // Keep these for backward compatibility
        set_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Error setting current book:', insertError);
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

    // Validate that only one current book exists for this club
    await validateSingleCurrentBook(clubId);

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
  // Get user entitlements and check club management permission
  const entitlements = await getUserEntitlements(userId);

  // Get club's store ID for contextual permission checking
  const { data: club, error: clubError } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  if (clubError) {
    console.error('Error fetching club store ID:', clubError);
    throw new Error('Failed to verify club permissions');
  }

  const canManage = canManageClub(entitlements, clubId, club.store_id);

  if (!canManage) {
    console.log('🚨 [setCurrentBook] permission check failed for user:', userId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can set the current book');
  }

  // Ensure only one current book per club by using explicit delete + insert transaction
  const { error: deleteError } = await supabase
    .from('current_books')
    .delete()
    .eq('club_id', clubId);

  if (deleteError) {
    console.error('Error removing existing current book:', deleteError);
    throw new Error('Failed to remove existing current book');
  }

  // Insert the new current book
  const { data, error: insertError } = await supabase
    .from('current_books')
    .insert([{
      club_id: clubId,
      title: book.title,
      author: book.author,
      set_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (insertError) {
    console.error('Error setting current book:', insertError);
    throw new Error('Failed to set current book');
  }

  // Validate that only one current book exists for this club
  await validateSingleCurrentBook(clubId);

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
    // First, validate and auto-fix any constraint violations
    await validateSingleCurrentBook(clubId);

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
