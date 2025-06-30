/**
 * Collections API Endpoint
 * 
 * Handles book collection operations with authentication
 * 
 * GET /api/books/collections - Get user's collections
 * POST /api/books/collections - Create new collection
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/middleware/auth';
import {
  getUserCollections,
  createCollection
} from '@/services/books/collectionsService';
import {
  validateUserId,
  validateCollectionName,
  validateCollectionDescription,
  validatePrivacySetting,
  throwIfInvalid,
  validateMultiple,
  createValidationError
} from '@/lib/api/books/validation';
import * as Sentry from "@sentry/react";

interface CreateCollectionRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

interface GetCollectionsQuery {
  includePrivate?: string;
  includeBookCount?: string;
  includePreviewCovers?: string;
  limit?: string;
  offset?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'book_count';
  sortOrder?: 'asc' | 'desc';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication for all operations
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response

  const { user } = authResult;

  try {
    if (req.method === 'GET') {
      return await handleGetCollections(req, res, user.id);
    } else if (req.method === 'POST') {
      return await handleCreateCollection(req, res, user.id);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Collections API error:', error);
    
    Sentry.captureException(error, {
      tags: {
        source: "collectionsAPI",
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
 * Handle GET request - Get user's collections
 */
async function handleGetCollections(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    // Parse query parameters
    const query = req.query as GetCollectionsQuery;
    const options = {
      includePrivate: query.includePrivate === 'true',
      includeBookCount: query.includeBookCount === 'true',
      includePreviewCovers: query.includePreviewCovers === 'true',
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
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

    console.log(`API: Getting collections for user ${userId}`, options);

    const collections = await getUserCollections(userId, options);

    return res.status(200).json({
      collections,
      count: collections.length,
      pagination: {
        limit: options.limit,
        offset: options.offset
      },
      options: {
        includeBookCount: options.includeBookCount,
        includePreviewCovers: options.includePreviewCovers
      }
    });

  } catch (error) {
    console.error('Error getting collections:', error);
    throw error;
  }
}

/**
 * Handle POST request - Create new collection
 */
async function handleCreateCollection(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const request = req.body as CreateCollectionRequest;

    if (!request) {
      throw createValidationError('Collection data is required', 'request');
    }

    // Validate request data
    const validationResult = validateMultiple([
      { result: validateCollectionName(request.name), field: 'name' },
      { result: validateCollectionDescription(request.description), field: 'description' },
      { result: validatePrivacySetting(request.is_public), field: 'is_public' }
    ]);

    throwIfInvalid(validationResult, 'createCollection');

    console.log(`API: Creating collection for user ${userId}:`, request.name);

    // Create collection
    const collection = await createCollection(userId, request);

    if (!collection) {
      throw new Error('Failed to create collection');
    }

    return res.status(201).json({
      collection,
      message: `Collection "${request.name}" created successfully`
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}
