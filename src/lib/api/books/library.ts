/**
 * Personal Library API
 * 
 * API endpoints for personal book library management
 * Wraps the books services with additional API-level functionality
 */

import { BookType } from '@/types/books';
import {
  PersonalBook,
  ReadingListItem,
  AddBookToLibraryRequest,
  PersonalBooksQueryOptions,
  addBookToLibrary as addBookToLibraryService,
  getUserBooks as getUserBooksService,
  removeBookFromLibrary as removeBookFromLibraryService,
  isBookInLibrary as isBookInLibraryService,
  getLibraryStats as getLibraryStatsService
} from '@/services/books';

/**
 * Add a book to user's personal library
 * @param userId User ID
 * @param bookData Book data to add
 * @returns Promise<PersonalBook | null>
 */
export async function addBookToLibrary(
  userId: string,
  bookData: AddBookToLibraryRequest
): Promise<PersonalBook | null> {
  try {
    console.log(`API: Adding book to library for user ${userId}:`, bookData.title);
    
    const result = await addBookToLibraryService(userId, bookData);
    
    if (result) {
      console.log(`API: Successfully added book to library: ${result.title}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('API: Error adding book to library:', error);
    throw new Error('Failed to add book to library. Please try again.');
  }
}

/**
 * Get user's personal book library
 * @param userId User ID
 * @param options Query options
 * @returns Promise<PersonalBook[]>
 */
export async function getUserBooks(
  userId: string,
  options: PersonalBooksQueryOptions = {}
): Promise<PersonalBook[]> {
  try {
    console.log(`API: Fetching books for user ${userId}`, options);
    
    const books = await getUserBooksService(userId, options);
    
    console.log(`API: Found ${books.length} books in user's library`);
    return books;
    
  } catch (error) {
    console.error('API: Error fetching user books:', error);
    throw new Error('Failed to load your library. Please try again.');
  }
}

/**
 * Remove a book from user's library
 * @param userId User ID
 * @param bookId Book ID to remove
 * @returns Promise<boolean>
 */
export async function removeBookFromLibrary(
  userId: string,
  bookId: string
): Promise<boolean> {
  try {
    console.log(`API: Removing book ${bookId} from library for user ${userId}`);
    
    const success = await removeBookFromLibraryService(userId, bookId);
    
    if (success) {
      console.log(`API: Successfully removed book from library`);
    }
    
    return success;
    
  } catch (error) {
    console.error('API: Error removing book from library:', error);
    throw new Error('Failed to remove book from library. Please try again.');
  }
}

/**
 * Check if a book exists in user's library
 * @param userId User ID
 * @param googleBooksId Google Books ID
 * @returns Promise<boolean>
 */
export async function isBookInLibrary(
  userId: string,
  googleBooksId: string
): Promise<boolean> {
  try {
    const exists = await isBookInLibraryService(userId, googleBooksId);
    return exists;
    
  } catch (error) {
    console.error('API: Error checking if book is in library:', error);
    return false;
  }
}

/**
 * Get user's library statistics
 * @param userId User ID
 * @returns Promise<LibraryStats>
 */
export async function getLibraryStats(userId: string): Promise<{
  totalBooks: number;
  genreDistribution: Record<string, number>;
  recentlyAdded: PersonalBook[];
}> {
  try {
    console.log(`API: Getting library stats for user ${userId}`);
    
    const stats = await getLibraryStatsService(userId);
    
    console.log(`API: User has ${stats.totalBooks} books in library`);
    return stats;
    
  } catch (error) {
    console.error('API: Error getting library stats:', error);
    throw new Error('Failed to load library statistics. Please try again.');
  }
}

/**
 * Convert Google Books API result to AddBookToLibraryRequest
 * @param book BookType from Google Books API
 * @returns AddBookToLibraryRequest
 */
export function convertBookTypeToLibraryRequest(book: BookType): AddBookToLibraryRequest {
  return {
    google_books_id: book.id,
    title: book.title,
    author: book.author || 'Unknown Author',
    cover_url: book.imageUrl || null,
    description: book.description || null,
    genre: book.categories?.[0] || null,
    published_date: book.publishedDate || null,
    page_count: book.pageCount && book.pageCount > 0 ? book.pageCount : null
  };
}

/**
 * Batch add books to library
 * @param userId User ID
 * @param books Array of books to add
 * @returns Promise<{ success: PersonalBook[], failed: BookType[] }>
 */
export async function batchAddBooksToLibrary(
  userId: string,
  books: BookType[]
): Promise<{ success: PersonalBook[], failed: BookType[] }> {
  const success: PersonalBook[] = [];
  const failed: BookType[] = [];
  
  console.log(`API: Batch adding ${books.length} books to library for user ${userId}`);
  
  for (const book of books) {
    try {
      // Check if book already exists
      const exists = await isBookInLibrary(userId, book.id);
      if (exists) {
        console.log(`API: Book ${book.title} already in library, skipping`);
        continue;
      }
      
      const bookData = convertBookTypeToLibraryRequest(book);
      const result = await addBookToLibrary(userId, bookData);
      
      if (result) {
        success.push(result);
      } else {
        failed.push(book);
      }
    } catch (error) {
      console.error(`API: Failed to add book ${book.title}:`, error);
      failed.push(book);
    }
  }
  
  console.log(`API: Batch add complete - ${success.length} success, ${failed.length} failed`);
  
  return { success, failed };
}
