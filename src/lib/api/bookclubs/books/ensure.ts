import { Book } from '@/types/books';
import { saveBook } from './storage';

/**
 * Ensure a book exists in the database and return it with UUID
 * @param book Book to ensure exists
 * @returns Book with database UUID
 */
export async function ensureBookExists(book: Book): Promise<Book> {
  try {
    // Save the book to database (will return existing ID if already exists)
    const bookUuid = await saveBook(book);
    
    // Return the book with the database UUID
    return {
      ...book,
      uuid: bookUuid
    };
  } catch (error) {
    console.error('Error ensuring book exists:', error);
    throw error;
  }
}
