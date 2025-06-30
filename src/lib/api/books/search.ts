/**
 * Books Search API
 * 
 * API endpoints for book search functionality
 * Integrates with Google Books API and personal library services
 */

import { BookType } from '@/types/books';
import { searchBooks as searchBooksService } from '@/services/books';

/**
 * Search books using Google Books API
 * @param query Search query string
 * @param maxResults Maximum number of results to return
 * @returns Promise<BookType[]>
 */
export async function searchBooks(
  query: string, 
  maxResults: number = 20
): Promise<BookType[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    console.log(`API: Searching books for query: ${query}`);
    
    const results = await searchBooksService(query.trim(), maxResults);
    
    console.log(`API: Found ${results.length} books`);
    return results;
    
  } catch (error) {
    console.error('API: Error searching books:', error);
    throw new Error('Failed to search books. Please try again.');
  }
}

/**
 * Get trending books by genre
 * @param genre Genre to search for
 * @param maxResults Maximum number of results
 * @returns Promise<BookType[]>
 */
export async function getTrendingBooks(
  genre: string = 'fiction',
  maxResults: number = 10
): Promise<BookType[]> {
  try {
    console.log(`API: Getting trending books for genre: ${genre}`);
    
    // Use search service with genre-specific query
    const query = `subject:${genre} orderBy:relevance`;
    const results = await searchBooksService(query, maxResults);
    
    console.log(`API: Found ${results.length} trending books`);
    return results;
    
  } catch (error) {
    console.error('API: Error getting trending books:', error);
    throw new Error('Failed to get trending books. Please try again.');
  }
}

/**
 * Get book recommendations based on user's library
 * @param userGenres Array of user's preferred genres
 * @param maxResults Maximum number of results
 * @returns Promise<BookType[]>
 */
export async function getBookRecommendations(
  userGenres: string[] = [],
  maxResults: number = 10
): Promise<BookType[]> {
  try {
    console.log(`API: Getting recommendations for genres:`, userGenres);
    
    if (userGenres.length === 0) {
      // Default recommendations
      return getTrendingBooks('fiction', maxResults);
    }
    
    // Search for books in user's preferred genres
    const genre = userGenres[0]; // Use first genre for now
    const query = `subject:${genre} orderBy:relevance`;
    const results = await searchBooksService(query, maxResults);
    
    console.log(`API: Found ${results.length} recommended books`);
    return results;
    
  } catch (error) {
    console.error('API: Error getting book recommendations:', error);
    throw new Error('Failed to get book recommendations. Please try again.');
  }
}
