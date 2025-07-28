/**
 * Server-side Authentication Utilities
 * 
 * Helper functions for extracting authenticated user information from API requests.
 * Uses existing authentication middleware patterns.
 */

import { NextApiRequest } from 'next';
import { withAuth } from '@/lib/api/middleware/auth';

/**
 * Extract authenticated user from API request
 * 
 * This is a simple wrapper around the existing withAuth middleware
 * that returns just the user object for convenience.
 * 
 * @param req - Next.js API request object
 * @returns User object if authenticated, null otherwise
 */
export async function getUserFromRequest(req: NextApiRequest): Promise<{ id: string; email?: string } | null> {
  try {
    // Create a mock response object for the middleware
    const mockRes = {
      status: () => ({ json: () => {} }),
      json: () => {}
    } as any;

    const authResult = await withAuth(req, mockRes);
    
    if (authResult && authResult.user) {
      return {
        id: authResult.user.id,
        email: authResult.user.email
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Validate that a user can only access their own data
 * 
 * @param requestUserId - User ID from the request
 * @param resourceUserId - User ID associated with the resource
 * @returns true if access is allowed, false otherwise
 */
export function validateUserAccess(requestUserId: string, resourceUserId: string): boolean {
  return requestUserId === resourceUserId;
}

/**
 * Create standardized authentication error response
 */
export function createAuthError(message: string = 'Authentication required') {
  return {
    error: message,
    code: 'UNAUTHORIZED'
  };
}

/**
 * Create standardized authorization error response
 */
export function createAuthzError(message: string = 'Access denied') {
  return {
    error: message,
    code: 'FORBIDDEN'
  };
}
