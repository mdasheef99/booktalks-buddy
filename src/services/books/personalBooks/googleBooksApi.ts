/**
 * Google Books API Integration Module
 * 
 * Google Books API integration and caching for personal books
 */

import { fetchBooksByQuery } from '@/services/googleBooksService';
import { BookType } from '@/types/books';
import * as Sentry from "@sentry/react";

// =====================================================
// Google Books Search Integration
// =====================================================

/**
 * Search books using Google Books API
 * Reuses existing Google Books service with caching and error handling
 */
export async function searchBooks(query: string, maxResults: number = 20): Promise<BookType[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    console.log(`Searching books for personal library: ${query}`);
    
    const books = await fetchBooksByQuery(query, maxResults);
    
    console.log(`Found ${books.length} books for personal library search`);
    return books;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/googleBooksApi",
        action: "searchBooks"
      },
      extra: { query, maxResults }
    });
    
    console.error("Error searching books for personal library:", error);
    throw new Error('Failed to search books. Please try again.');
  }
}

/**
 * Search books with enhanced filtering for personal library
 */
export async function searchBooksWithFilters(
  query: string,
  filters: {
    category?: string;
    language?: string;
    printType?: 'all' | 'books' | 'magazines';
    orderBy?: 'relevance' | 'newest';
  } = {},
  maxResults: number = 20
): Promise<BookType[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    // Build enhanced query with filters
    let enhancedQuery = query.trim();
    
    if (filters.category) {
      enhancedQuery += ` subject:${filters.category}`;
    }

    console.log(`Searching books with filters for personal library: ${enhancedQuery}`, filters);
    
    // Use the existing Google Books service
    const books = await fetchBooksByQuery(enhancedQuery, maxResults);
    
    // Apply additional client-side filtering if needed
    let filteredBooks = books;
    
    if (filters.language) {
      filteredBooks = filteredBooks.filter(book => 
        book.language?.toLowerCase() === filters.language?.toLowerCase()
      );
    }

    console.log(`Found ${filteredBooks.length} filtered books for personal library search`);
    return filteredBooks;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/googleBooksApi",
        action: "searchBooksWithFilters"
      },
      extra: { query, filters, maxResults }
    });
    
    console.error("Error searching books with filters:", error);
    throw new Error('Failed to search books with filters. Please try again.');
  }
}

/**
 * Get book details by Google Books ID
 */
export async function getBookDetails(googleBooksId: string): Promise<BookType | null> {
  try {
    if (!googleBooksId || googleBooksId.trim() === '') {
      return null;
    }

    console.log(`Fetching book details for: ${googleBooksId}`);
    
    // Use the search function with the specific ID
    const books = await fetchBooksByQuery(`id:${googleBooksId}`, 1);
    
    if (books.length > 0) {
      console.log(`Found book details for: ${books[0].title}`);
      return books[0];
    }

    console.log(`No book found for ID: ${googleBooksId}`);
    return null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/googleBooksApi",
        action: "getBookDetails"
      },
      extra: { googleBooksId }
    });
    
    console.error("Error fetching book details:", error);
    return null;
  }
}

/**
 * Search books by author
 */
export async function searchBooksByAuthor(
  author: string,
  maxResults: number = 20
): Promise<BookType[]> {
  try {
    if (!author || author.trim() === '') {
      return [];
    }

    const query = `inauthor:"${author.trim()}"`;
    console.log(`Searching books by author: ${author}`);
    
    const books = await fetchBooksByQuery(query, maxResults);
    
    console.log(`Found ${books.length} books by author: ${author}`);
    return books;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/googleBooksApi",
        action: "searchBooksByAuthor"
      },
      extra: { author, maxResults }
    });
    
    console.error("Error searching books by author:", error);
    throw new Error('Failed to search books by author. Please try again.');
  }
}

/**
 * Search books by ISBN
 */
export async function searchBooksByISBN(isbn: string): Promise<BookType[]> {
  try {
    if (!isbn || isbn.trim() === '') {
      return [];
    }

    const cleanISBN = isbn.replace(/[-\s]/g, ''); // Remove hyphens and spaces
    const query = `isbn:${cleanISBN}`;
    console.log(`Searching books by ISBN: ${cleanISBN}`);
    
    const books = await fetchBooksByQuery(query, 5);
    
    console.log(`Found ${books.length} books for ISBN: ${cleanISBN}`);
    return books;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/googleBooksApi",
        action: "searchBooksByISBN"
      },
      extra: { isbn }
    });
    
    console.error("Error searching books by ISBN:", error);
    throw new Error('Failed to search books by ISBN. Please try again.');
  }
}

/**
 * Get popular books in a category
 */
export async function getPopularBooksInCategory(
  category: string,
  maxResults: number = 20
): Promise<BookType[]> {
  try {
    if (!category || category.trim() === '') {
      return [];
    }

    const query = `subject:${category.trim()} orderBy:relevance`;
    console.log(`Fetching popular books in category: ${category}`);
    
    const books = await fetchBooksByQuery(query, maxResults);
    
    console.log(`Found ${books.length} popular books in category: ${category}`);
    return books;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/googleBooksApi",
        action: "getPopularBooksInCategory"
      },
      extra: { category, maxResults }
    });
    
    console.error("Error fetching popular books in category:", error);
    throw new Error('Failed to fetch popular books. Please try again.');
  }
}
