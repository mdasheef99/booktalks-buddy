import { supabase } from '@/lib/supabase';
import { Book } from '@/types/books';

/**
 * Save a book to the database
 * @param book Book to save
 * @returns ID of the saved book
 */
export async function saveBook(book: Book): Promise<string> {
  try {
    // Sanitize the Google Books ID to handle special characters
    const sanitizedGoogleBooksId = book.id ? book.id.replace(/[^a-zA-Z0-9]/g, '_') : null;

    if (!sanitizedGoogleBooksId) {
      console.error('Invalid Google Books ID:', book.id);
      throw new Error('Invalid Google Books ID');
    }

    console.log(`Checking for existing book with Google Books ID: ${sanitizedGoogleBooksId}`);

    // Check if the book already exists by Google Books ID
    const { data: existingBook, error: checkError } = await supabase
      .from('books')
      .select('id')
      .eq('google_books_id', sanitizedGoogleBooksId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing book:', checkError);
      throw new Error('Failed to check for existing book');
    }

    // If the book already exists, return its ID
    if (existingBook) {
      console.log(`Book already exists with ID: ${existingBook.id}`);
      return existingBook.id;
    }

    console.log('Book does not exist, creating new entry');

    // Otherwise, insert the new book
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert({
        google_books_id: sanitizedGoogleBooksId,
        title: book.title,
        author: book.author || 'Unknown Author',
        cover_url: book.imageUrl,
        description: book.description,
        genre: book.categories && book.categories.length > 0 ? book.categories[0] : 'Uncategorized'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error saving book:', insertError);
      throw new Error('Failed to save book');
    }

    console.log(`New book created with ID: ${newBook.id}`);
    return newBook.id;
  } catch (error) {
    console.error('Unexpected error saving book:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to save book');
  }
}
