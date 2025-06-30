/**
 * Personal Book Detail API Endpoint
 * 
 * Handles individual personal book operations with authentication
 * 
 * GET /api/books/personal/[bookId] - Get specific book from user's library
 * PUT /api/books/personal/[bookId] - Update book in user's library
 * DELETE /api/books/personal/[bookId] - Remove book from user's library
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/middleware/auth';
import {
  getUserBooks,
  removeBookFromLibrary
} from '@/lib/api/books/library';
import {
  updateBookInLibrary
} from '@/services/books/personalBooksService';
import {
  validateUserId,
  validatePersonalBookId,
  validateBookTitle,
  validateBookAuthor,
  validateBookDescription,
  validateBookGenre,
  validatePageCount,
  validateISBN,
  throwIfInvalid,
  createValidationError
} from '@/lib/api/books/validation';
import { AddBookToLibraryRequest } from '@/services/books';
import * as Sentry from "@sentry/react";

interface UpdateBookRequest {
  title?: string;
  author?: string;
  description?: string;
  genre?: string;
  page_count?: number;
  isbn?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication for all operations
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response

  const { user } = authResult;
  const { bookId } = req.query;

  // Validate bookId parameter
  if (!bookId || typeof bookId !== 'string') {
    return res.status(400).json({ error: 'Invalid book ID parameter' });
  }

  try {
    // Validate book ID format
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');

    if (req.method === 'GET') {
      return await handleGetPersonalBook(req, res, user.id, bookId);
    } else if (req.method === 'PUT') {
      return await handleUpdatePersonalBook(req, res, user.id, bookId);
    } else if (req.method === 'DELETE') {
      return await handleDeletePersonalBook(req, res, user.id, bookId);
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Personal book detail API error:', error);
    
    Sentry.captureException(error, {
      tags: {
        source: "personalBookDetailAPI",
        method: req.method,
        userId: user.id
      },
      extra: {
        bookId,
        body: req.body
      }
    });

    if (error instanceof Error && error.name === 'BooksValidationError') {
      return res.status(400).json({
        error: error.message,
        field: (error as any).field,
        details: (error as any).details
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle GET request - Get specific book from user's library
 */
async function handleGetPersonalBook(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  bookId: string
) {
  try {
    console.log(`API: Getting personal book ${bookId} for user ${userId}`);

    // Get all user books and find the specific one
    // This ensures RLS policies are respected
    const books = await getUserBooks(userId);
    const book = books.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    return res.status(200).json({ book });

  } catch (error) {
    console.error('Error getting personal book:', error);
    throw error;
  }
}

/**
 * Handle PUT request - Update book in user's library
 */
async function handleUpdatePersonalBook(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  bookId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const updates = req.body as UpdateBookRequest;

    if (!updates || Object.keys(updates).length === 0) {
      throw createValidationError('Update data is required', 'updates');
    }

    // Validate update fields if provided
    if (updates.title !== undefined) {
      throwIfInvalid(validateBookTitle(updates.title), 'title');
    }
    if (updates.author !== undefined) {
      throwIfInvalid(validateBookAuthor(updates.author), 'author');
    }
    if (updates.description !== undefined) {
      throwIfInvalid(validateBookDescription(updates.description), 'description');
    }
    if (updates.genre !== undefined) {
      throwIfInvalid(validateBookGenre(updates.genre), 'genre');
    }
    if (updates.page_count !== undefined) {
      throwIfInvalid(validatePageCount(updates.page_count), 'page_count');
    }
    if (updates.isbn !== undefined) {
      throwIfInvalid(validateISBN(updates.isbn), 'isbn');
    }

    console.log(`API: Updating personal book ${bookId} for user ${userId}:`, updates);

    // Update book in library
    const updatedBook = await updateBookInLibrary(userId, bookId, updates as Partial<AddBookToLibraryRequest>);

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    return res.status(200).json({
      book: updatedBook,
      message: 'Book updated successfully'
    });

  } catch (error) {
    console.error('Error updating personal book:', error);
    throw error;
  }
}

/**
 * Handle DELETE request - Remove book from user's library
 */
async function handleDeletePersonalBook(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  bookId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    console.log(`API: Removing personal book ${bookId} for user ${userId}`);

    // Remove book from library
    const success = await removeBookFromLibrary(userId, bookId);

    if (!success) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    return res.status(200).json({
      message: 'Book removed from library successfully'
    });

  } catch (error) {
    console.error('Error removing personal book:', error);
    throw error;
  }
}
