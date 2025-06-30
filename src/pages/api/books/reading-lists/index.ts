/**
 * Reading Lists API Endpoint
 * 
 * Handles reading list operations with authentication
 * 
 * GET /api/books/reading-lists - Get user's reading list
 * POST /api/books/reading-lists - Add book to reading list
 * PUT /api/books/reading-lists - Update reading list item
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/middleware/auth';
import {
  getReadingList,
  addToReadingList,
  updateReadingListItem
} from '@/lib/api/books/reading-lists';
import {
  validateUserId,
  validatePersonalBookId,
  validateReadingStatus,
  validateOptionalRating,
  validateReviewText,
  validatePrivacySetting,
  throwIfInvalid,
  validateMultiple,
  createValidationError
} from '@/lib/api/books/validation';
import { ReadingStatus } from '@/services/books';
import * as Sentry from "@sentry/react";

interface AddToReadingListRequest {
  book_id: string;
  status: ReadingStatus;
  is_public?: boolean;
}

interface UpdateReadingListRequest {
  book_id: string;
  status?: ReadingStatus;
  rating?: number;
  review_text?: string;
  is_public?: boolean;
  review_is_public?: boolean;
}

interface GetReadingListQuery {
  status?: ReadingStatus;
  includePrivate?: string;
  limit?: string;
  offset?: string;
  sortBy?: 'added_at' | 'status_changed_at' | 'title' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication for all operations
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response

  const { user } = authResult;

  try {
    if (req.method === 'GET') {
      return await handleGetReadingList(req, res, user.id);
    } else if (req.method === 'POST') {
      return await handleAddToReadingList(req, res, user.id);
    } else if (req.method === 'PUT') {
      return await handleUpdateReadingListItem(req, res, user.id);
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Reading lists API error:', error);
    
    Sentry.captureException(error, {
      tags: {
        source: "readingListsAPI",
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
        error: error.message,
        field: (error as any).field,
        details: (error as any).details
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle GET request - Get user's reading list
 */
async function handleGetReadingList(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    // Parse query parameters
    const query = req.query as GetReadingListQuery;
    const options = {
      status: query.status,
      includePrivate: query.includePrivate === 'true',
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    // Validate status if provided
    if (options.status) {
      throwIfInvalid(validateReadingStatus(options.status), 'status');
    }

    // Validate numeric parameters
    if (options.limit !== undefined && (isNaN(options.limit) || options.limit < 1 || options.limit > 100)) {
      throw createValidationError('Limit must be between 1 and 100', 'limit');
    }
    if (options.offset !== undefined && (isNaN(options.offset) || options.offset < 0)) {
      throw createValidationError('Offset must be non-negative', 'offset');
    }

    console.log(`API: Getting reading list for user ${userId}`, options);

    const readingList = await getReadingList(userId, options);

    return res.status(200).json({
      readingList,
      count: readingList.length,
      pagination: {
        limit: options.limit,
        offset: options.offset
      }
    });

  } catch (error) {
    console.error('Error getting reading list:', error);
    throw error;
  }
}

/**
 * Handle POST request - Add book to reading list
 */
async function handleAddToReadingList(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const request = req.body as AddToReadingListRequest;

    if (!request) {
      throw createValidationError('Request data is required', 'request');
    }

    // Validate request data
    const validationResult = validateMultiple([
      { result: validatePersonalBookId(request.book_id), field: 'book_id' },
      { result: validateReadingStatus(request.status), field: 'status' },
      { result: validatePrivacySetting(request.is_public), field: 'is_public' }
    ]);

    throwIfInvalid(validationResult, 'addToReadingList');

    console.log(`API: Adding book to reading list for user ${userId}:`, request);

    // Add to reading list
    const readingListItem = await addToReadingList(userId, request);

    if (!readingListItem) {
      throw new Error('Failed to add book to reading list');
    }

    return res.status(201).json({
      readingListItem,
      message: 'Book added to reading list successfully'
    });

  } catch (error) {
    console.error('Error adding to reading list:', error);
    throw error;
  }
}

/**
 * Handle PUT request - Update reading list item
 */
async function handleUpdateReadingListItem(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const request = req.body as UpdateReadingListRequest;

    if (!request || !request.book_id) {
      throw createValidationError('Book ID is required', 'book_id');
    }

    // Validate book ID
    throwIfInvalid(validatePersonalBookId(request.book_id), 'book_id');

    // Validate update fields if provided
    const validations = [];
    if (request.status !== undefined) {
      validations.push({ result: validateReadingStatus(request.status), field: 'status' });
    }
    if (request.rating !== undefined) {
      validations.push({ result: validateOptionalRating(request.rating), field: 'rating' });
    }
    if (request.review_text !== undefined) {
      validations.push({ result: validateReviewText(request.review_text), field: 'review_text' });
    }
    if (request.is_public !== undefined) {
      validations.push({ result: validatePrivacySetting(request.is_public), field: 'is_public' });
    }
    if (request.review_is_public !== undefined) {
      validations.push({ result: validatePrivacySetting(request.review_is_public), field: 'review_is_public' });
    }

    if (validations.length > 0) {
      const validationResult = validateMultiple(validations);
      throwIfInvalid(validationResult, 'updateReadingListItem');
    }

    console.log(`API: Updating reading list item for user ${userId}, book ${request.book_id}:`, request);

    // Extract book_id and create updates object
    const { book_id, ...updates } = request;

    // Update reading list item
    const updatedItem = await updateReadingListItem(userId, book_id, updates);

    if (!updatedItem) {
      return res.status(404).json({ error: 'Reading list item not found' });
    }

    return res.status(200).json({
      readingListItem: updatedItem,
      message: 'Reading list item updated successfully'
    });

  } catch (error) {
    console.error('Error updating reading list item:', error);
    throw error;
  }
}
