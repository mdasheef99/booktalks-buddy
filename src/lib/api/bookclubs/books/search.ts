import { fetchBooksByQuery } from '@/services/googleBooksService';
import { Book } from '@/types/books';

/**
 * Search for books using Google Books API
 * @param query Search query
 * @returns Array of books matching the query
 */
export async function searchBooks(query: string): Promise<Book[]> {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const books = await fetchBooksByQuery(query);
    return books;
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error('Failed to search for books');
  }
}
