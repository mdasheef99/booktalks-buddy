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

    // Check if this book is already nominated in this club
    const { data: existingNomination, error: checkError } = await supabase
      .from('book_nominations')
      .select('id, status')
      .eq('club_id', clubId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing nomination:', checkError);
      throw new Error('Failed to check for existing nomination');
    }

    // If the book is already nominated and active, return an error
    if (existingNomination && existingNomination.status === 'active') {
      throw new Error('This book has already been nominated in this club');
    }

    // If the book was previously nominated but archived, reactivate it
    if (existingNomination && existingNomination.status === 'archived') {
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

    // Otherwise, create a new nomination
    console.log(`Creating new nomination for book ID: ${bookId}`);

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

    if (insertError) {
      console.error('Error creating nomination:', insertError);
      throw new Error('Failed to nominate book');
    }

    console.log(`Nomination created successfully with ID: ${nomination.id}`);
    return getNominationById(nomination.id, userId);
  } catch (error) {
    console.error('Unexpected error nominating book:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to nominate book');
  }
}
