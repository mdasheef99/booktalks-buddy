import { supabase } from '@/lib/supabase';
import { isClubMember } from '@/lib/api/auth';
import { Book } from '@/types/books';
import { saveBook } from '../books/storage';
import { getNominationById } from './retrieve';

/**
 * Nominate a book for a club
 * @param userId User ID
 * @param clubId Club ID
 * @param book Book to nominate
 * @returns The created nomination
 */
export async function nominateBook(userId: string, clubId: string, book: Book) {
  try {
    console.log(`Nominating book "${book.title}" by ${book.author || 'Unknown Author'} for club ${clubId}`);

    // Validate inputs
    if (!userId) throw new Error('User ID is required');
    if (!clubId) throw new Error('Club ID is required');
    if (!book || !book.title) throw new Error('Valid book information is required');

    // Check if user is a member of the club
    if (!(await isClubMember(userId, clubId))) {
      throw new Error('You must be a member of the club to nominate books');
    }

    // Save the book to the database
    let bookId: string;
    try {
      bookId = await saveBook(book);
    } catch (saveError) {
      console.error('Error saving book:', saveError);
      throw new Error(`Failed to save book: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
    }

    console.log(`Book saved with ID: ${bookId}, checking for existing nominations`);

    // Use a more robust approach to handle the unique constraint
    // First, try to insert the nomination directly and handle constraint violations
    console.log(`Attempting to create nomination for book ID: ${bookId}`);

    const { data: nomination, error: insertError } = await supabase
      .from('book_nominations')
      .insert({
        club_id: clubId,
        book_id: bookId,
        nominated_by: userId,
        status: 'active'
      })
      .select('id')
      .single();

    // If insertion succeeds, we're done
    if (!insertError && nomination) {
      console.log(`Nomination created successfully with ID: ${nomination.id}`);
      return getNominationById(nomination.id, userId);
    }

    // Handle constraint violation (duplicate nomination)
    if (insertError && insertError.code === '23505' && insertError.message.includes('unique_book_per_club')) {
      console.log(`Book already nominated in this club, checking existing nomination status`);

      // Get the existing nomination to determine what to do
      const { data: existingNomination, error: checkError } = await supabase
        .from('book_nominations')
        .select('id, status, nominated_by')
        .eq('club_id', clubId)
        .eq('book_id', bookId)
        .single();

      if (checkError) {
        console.error('Error fetching existing nomination:', checkError);
        throw new Error('This book has already been nominated in this club');
      }

      // Handle different nomination statuses
      if (existingNomination.status === 'active') {
        throw new Error('This book has already been nominated in this club');
      }

      if (existingNomination.status === 'selected') {
        throw new Error('This book has already been selected as the current book for this club');
      }

      // If the nomination is archived, reactivate it
      if (existingNomination.status === 'archived') {
        console.log(`Reactivating archived nomination: ${existingNomination.id}`);

        const { data: updatedNomination, error: updateError } = await supabase
          .from('book_nominations')
          .update({
            status: 'active',
            nominated_by: userId,
            nominated_at: new Date().toISOString()
          })
          .eq('id', existingNomination.id)
          .select('*')
          .single();

        if (updateError) {
          console.error('Error reactivating nomination:', updateError);
          throw new Error('Failed to reactivate nomination');
        }

        console.log(`Nomination reactivated successfully`);
        return getNominationById(updatedNomination.id, userId);
      }

      // Fallback for unknown status
      throw new Error('This book has already been nominated in this club');
    }

    // Handle other insertion errors
    if (insertError) {
      console.error('Error creating nomination:', insertError);

      // Provide more specific error messages
      if (insertError.code === '23503') {
        throw new Error('Invalid book or club reference');
      } else if (insertError.code === '23502') {
        throw new Error('Missing required nomination information');
      } else {
        throw new Error(`Failed to nominate book: ${insertError.message}`);
      }
    }

    // This should never be reached, but just in case
    throw new Error('Unexpected error in nomination process');
  } catch (error) {
    console.error('Unexpected error nominating book:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to nominate book');
  }
}
