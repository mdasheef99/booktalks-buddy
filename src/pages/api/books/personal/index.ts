/**
 * Personal Books API Endpoint
 * 
 * Handles personal book library operations with authentication
 * 
 * GET /api/books/personal - Get user's personal book library
 * POST /api/books/personal - Add book to user's personal library
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/middleware/auth';
import {
  addBookToLibrary,
  getUserBooks,
  convertBookTypeToLibraryRequest
} from '@/lib/api/books/library';
import {
  validateUserId,
  validateGoogleBooksId,
  validateBookTitle,
  validateBookAuthor,
  throwIfInvalid,
  validateMultiple,
  createValidationError
} from '@/lib/api/books/validation';
import { BookType } from '@/types/books';
import * as Sentry from "@sentry/react";

interface AddBookRequest {
  book: BookType;
}

interface GetBooksQuery {
  limit?: string;
  offset?: string;
  search?: string;
  genre?: string;
  sortBy?: 'title' | 'author' | 'added_at';
  sortOrder?: 'asc' | 'desc';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication for all operations
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response

  const { user } = authResult;

  try {
    if (req.method === 'GET') {
      return await handleGetPersonalBooks(req, res, user.id);
    } else if (req.method === 'POST') {
      return await handleAddBookToLibrary(req, res, user.id);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Personal books API error:', error);
    
    Sentry.captureException(error, {
      tags: {
        source: "personalBooksAPI",
        method: req.method,
        userId: user.id
      },
      extra: {
        query: req.query,
        body: req.body
      }
    });

    if (error instanceof Error && error.name === 'BooksValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message,
        field: (error as any).field,
        details: (error as any).details
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Handle GET request - Get user's personal book library
 */
async function handleGetPersonalBooks(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    // Parse query parameters
    const query = req.query as GetBooksQuery;
    const options = {
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
      search: query.search,
      genre: query.genre,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    // Validate numeric parameters
    if (options.limit !== undefined && (isNaN(options.limit) || options.limit < 1 || options.limit > 100)) {
      throw createValidationError('Limit must be between 1 and 100', 'limit');
    }
    if (options.offset !== undefined && (isNaN(options.offset) || options.offset < 0)) {
      throw createValidationError('Offset must be non-negative', 'offset');
    }

    console.log(`API: Getting personal books for user ${userId}`, options);

    const books = await getUserBooks(userId, options);

    return res.status(200).json({
      success: true,
      books,
      count: books.length,
      pagination: {
        limit: options.limit,
        offset: options.offset
      }
    });

  } catch (error) {
    console.error('Error getting personal books:', error);
    throw error;
  }
}

/**
 * Handle POST request - Add book to user's personal library
 */
async function handleAddBookToLibrary(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const { book } = req.body as AddBookRequest;

    if (!book) {
      throw createValidationError('Book data is required', 'book');
    }

    // Validate book data
    const validationResult = validateMultiple([
      { result: validateGoogleBooksId(book.id), field: 'book.id' },
      { result: validateBookTitle(book.title), field: 'book.title' },
      { result: validateBookAuthor(book.author), field: 'book.author' }
    ]);

    throwIfInvalid(validationResult, 'addBookToLibrary');

    console.log(`API: Adding book to library for user ${userId}:`, book.title);

    // Convert BookType to library request format
    const bookData = convertBookTypeToLibraryRequest(book);

    // Add book to library
    const personalBook = await addBookToLibrary(userId, bookData);

    if (!personalBook) {
      throw new Error('Failed to add book to library');
    }

    return res.status(201).json({
      success: true,
      book: personalBook,
      message: `Successfully added "${book.title}" to your library`
    });

  } catch (error) {
    console.error('Error adding book to library:', error);
    throw error;
  }
}
