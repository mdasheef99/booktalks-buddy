/**
 * Books Search API Endpoint
 * 
 * Handles book search operations with optional authentication
 * Public access allowed but enhanced features for authenticated users
 * 
 * GET /api/books/search - Search books via Google Books API
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withPublicAccess } from '@/lib/api/middleware/auth';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import {
  searchBooks,
  getTrendingBooks,
  getBookRecommendations
} from '@/lib/api/books/search';
import {
  isBookInLibrary
} from '@/lib/api/books/library';
import {
  createValidationError
} from '@/lib/api/books/validation';
import * as Sentry from "@sentry/react";

interface SearchQuery {
  q?: string; // Search query
  type?: 'search' | 'trending' | 'recommendations';
  genre?: string;
  maxResults?: string;
  includeLibraryStatus?: string; // 'true' to include library status for authenticated users
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use public access middleware (allows both authenticated and anonymous users)
    const { supabase } = await withPublicAccess(req, res);

    // Try to get user session for enhanced features
    let userId: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
    } catch (error) {
      // Ignore session errors for public access
      console.log('No user session found, proceeding with public access');
    }

    return await handleSearchBooks(req, res, userId);

  } catch (error) {
    console.error('Books search API error:', error);
    
    Sentry.captureException(error, {
      tags: {
        source: "booksSearchAPI",
        method: req.method
      },
      extra: {
        query: req.query
      }
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle book search request
 */
async function handleSearchBooks(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string | null
) {
  try {
    const query = req.query as SearchQuery;
    const searchType = query.type || 'search';
    const maxResults = query.maxResults ? parseInt(query.maxResults, 10) : 20;
    const includeLibraryStatus = query.includeLibraryStatus === 'true' && userId !== null;

    // Validate maxResults
    if (isNaN(maxResults) || maxResults < 1 || maxResults > 50) {
      throw createValidationError('maxResults must be between 1 and 50', 'maxResults');
    }

    let books = [];

    switch (searchType) {
      case 'search':
        if (!query.q || query.q.trim() === '') {
          throw createValidationError('Search query is required', 'q');
        }
        console.log(`API: Searching books for query: ${query.q}`);
        books = await searchBooks(query.q.trim(), maxResults);
        break;

      case 'trending':
        const genre = query.genre || 'fiction';
        console.log(`API: Getting trending books for genre: ${genre}`);
        books = await getTrendingBooks(genre, maxResults);
        break;

      case 'recommendations':
        if (!userId) {
          // For anonymous users, return trending books as recommendations
          console.log('API: Getting recommendations for anonymous user (trending books)');
          books = await getTrendingBooks('fiction', maxResults);
        } else {
          console.log(`API: Getting recommendations for user ${userId}`);
          // TODO: Get user's preferred genres from their library
          const userGenres: string[] = []; // Placeholder
          books = await getBookRecommendations(userGenres, maxResults);
        }
        break;

      default:
        throw createValidationError('Invalid search type', 'type');
    }

    // Enhance results with library status for authenticated users
    if (includeLibraryStatus && userId) {
      console.log(`API: Adding library status for ${books.length} books`);
      
      const booksWithStatus = await Promise.all(
        books.map(async (book) => {
          try {
            const inLibrary = await isBookInLibrary(userId, book.id);
            return {
              ...book,
              inLibrary
            };
          } catch (error) {
            console.error(`Error checking library status for book ${book.id}:`, error);
            return {
              ...book,
              inLibrary: false
            };
          }
        })
      );

      return res.status(200).json({
        books: booksWithStatus,
        count: booksWithStatus.length,
        searchType,
        query: query.q,
        genre: query.genre,
        authenticated: true,
        libraryStatusIncluded: true
      });
    }

    // Return basic results for public access
    return res.status(200).json({
      books,
      count: books.length,
      searchType,
      query: query.q,
      genre: query.genre,
      authenticated: userId !== null,
      libraryStatusIncluded: false
    });

  } catch (error) {
    console.error('Error handling book search:', error);
    throw error;
  }
}
