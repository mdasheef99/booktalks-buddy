/**
 * Backend Enforcement Utilities
 *
 * This module provides utility functions for API route integration,
 * middleware helpers, and common enforcement patterns.
 * 
 * Implements requirements from Phase 2 Task 3: Backend Enforcement Logic
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AuthenticatedRequest, EnforcementResult } from './types';
import { trackMiddlewareEnforcement, trackMembershipLimitCheck } from './tracking';

/**
 * Extract user ID from various authentication sources
 * 
 * Supports both Supabase session and header-based authentication
 */
export function extractUserId(req: NextApiRequest): string | null {
  // Try header-based authentication first (for development/testing)
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) {
    return headerUserId;
  }

  // Try to extract from authenticated request
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.id) {
    return authReq.user.id;
  }

  return null;
}

/**
 * Extract context ID from request parameters
 * 
 * Supports various parameter naming conventions
 */
export function extractContextId(
  req: NextApiRequest,
  contextType: 'club' | 'store' | 'user'
): string | null {
  const { query } = req;

  switch (contextType) {
    case 'club':
      return (query.clubId || query.club_id || query.id) as string || null;
    case 'store':
      return (query.storeId || query.store_id || query.id) as string || null;
    case 'user':
      return (query.userId || query.user_id || query.id) as string || null;
    default:
      return null;
  }
}

/**
 * Create standardized error response for enforcement failures
 * 
 * Provides consistent error format across all API endpoints
 */
export function createEnforcementErrorResponse(
  result: EnforcementResult,
  req: NextApiRequest
): { status: number; body: any } {
  const baseResponse = {
    error: result.reason || 'Access denied',
    code: 'ENFORCEMENT_FAILED',
    timestamp: new Date().toISOString(),
    path: req.url || 'unknown'
  };

  // Add upgrade suggestions for membership-related errors
  if (result.data?.upgradeRequired) {
    return {
      status: result.statusCode || 403,
      body: {
        ...baseResponse,
        upgrade: {
          required: true,
          currentTier: result.data.currentTier || 'MEMBER',
          requiredTier: result.data.requiredTier,
          benefits: getTierBenefits(result.data.requiredTier),
          upgradeUrl: '/upgrade'
        },
        limits: result.data.currentCount !== undefined ? {
          current: result.data.currentCount,
          limit: result.data.limit
        } : undefined
      }
    };
  }

  // Add context-specific information
  if (result.data?.storeRestriction) {
    return {
      status: result.statusCode || 403,
      body: {
        ...baseResponse,
        restriction: {
          type: 'store_policy',
          storeId: result.data.storeId,
          message: 'This store has specific policies that prevent this action'
        }
      }
    };
  }

  // Standard error response
  return {
    status: result.statusCode || 403,
    body: {
      ...baseResponse,
      data: result.data
    }
  };
}

/**
 * Get tier benefits for upgrade suggestions
 */
function getTierBenefits(tier: string): string[] {
  switch (tier) {
    case 'PRIVILEGED':
      return [
        'Create up to 3 book clubs',
        'Join unlimited clubs',
        'Nominate books for club reading',
        'Access premium content',
        'Join premium clubs'
      ];
    case 'PRIVILEGED_PLUS':
      return [
        'Create unlimited book clubs',
        'Join exclusive clubs',
        'Send direct messages',
        'Access exclusive content',
        'Priority customer support'
      ];
    default:
      return [];
  }
}

/**
 * Wrapper for API handlers with automatic enforcement tracking
 * 
 * Provides consistent tracking across all enforcement points
 */
export function withEnforcementTracking<T extends NextApiRequest, U extends NextApiResponse>(
  handler: (req: T, res: U) => Promise<void>,
  options: {
    endpoint?: string;
    requiredPermission?: string;
    contextType?: 'platform' | 'store' | 'club';
  } = {}
) {
  return async (req: T, res: U) => {
    const startTime = Date.now();
    const userId = extractUserId(req);
    const endpoint = options.endpoint || req.url || 'unknown';
    const method = req.method || 'UNKNOWN';

    try {
      await handler(req, res);

      // Track successful enforcement
      if (userId) {
        await trackMiddlewareEnforcement(
          userId,
          endpoint,
          method,
          true,
          options.requiredPermission
        );
      }
    } catch (error) {
      // Track failed enforcement
      if (userId) {
        await trackMiddlewareEnforcement(
          userId,
          endpoint,
          method,
          false,
          options.requiredPermission
        );
      }
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      console.log(`API ${method} ${endpoint} completed in ${duration}ms`);
    }
  };
}

/**
 * Validate request parameters for enforcement functions
 * 
 * Ensures required parameters are present and valid
 */
export function validateEnforcementParams(
  req: NextApiRequest,
  requiredParams: string[]
): { valid: boolean; missing: string[]; errors: string[] } {
  const missing: string[] = [];
  const errors: string[] = [];

  for (const param of requiredParams) {
    const value = req.query[param] || req.body?.[param];
    
    if (!value) {
      missing.push(param);
    } else if (typeof value === 'string' && value.trim() === '') {
      errors.push(`${param} cannot be empty`);
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

/**
 * Rate limiting helper for enforcement operations
 * 
 * Prevents abuse of enforcement checks
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  userId: string,
  operation: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${userId}:${operation}`;
  const now = Date.now();
  
  let bucket = rateLimitMap.get(key);
  
  if (!bucket || now > bucket.resetTime) {
    bucket = {
      count: 0,
      resetTime: now + windowMs
    };
    rateLimitMap.set(key, bucket);
  }

  bucket.count++;
  
  const allowed = bucket.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - bucket.count);

  return {
    allowed,
    remaining,
    resetTime: bucket.resetTime
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  for (const [key, bucket] of rateLimitMap.entries()) {
    if (now > bucket.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Helper to send enforcement result as HTTP response
 * 
 * Standardizes response format and includes tracking
 */
export async function sendEnforcementResult(
  req: NextApiRequest,
  res: NextApiResponse,
  result: EnforcementResult,
  operation: string
): Promise<void> {
  const userId = extractUserId(req);

  // Track the enforcement result
  if (userId) {
    await trackMembershipLimitCheck(
      userId,
      operation,
      result.allowed,
      result.reason
    );
  }

  if (result.allowed) {
    // Success response
    res.status(200).json({
      success: true,
      message: 'Operation allowed',
      data: result.data
    });
  } else {
    // Error response with detailed information
    const errorResponse = createEnforcementErrorResponse(result, req);
    res.status(errorResponse.status).json(errorResponse.body);
  }
}

/**
 * Middleware helper for common API patterns
 * 
 * Combines authentication, validation, and enforcement
 */
export function createEnforcementHandler(
  options: {
    requiredParams?: string[];
    rateLimit?: { maxRequests: number; windowMs: number };
    operation: string;
  }
) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    enforcementFn: (req: NextApiRequest) => Promise<EnforcementResult>
  ) => {
    try {
      // Extract user ID
      const userId = extractUserId(req);
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      // Validate parameters
      if (options.requiredParams) {
        const validation = validateEnforcementParams(req, options.requiredParams);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Invalid request parameters',
            code: 'VALIDATION_FAILED',
            missing: validation.missing,
            errors: validation.errors
          });
        }
      }

      // Check rate limits
      if (options.rateLimit) {
        const rateCheck = checkRateLimit(
          userId,
          options.operation,
          options.rateLimit.maxRequests,
          options.rateLimit.windowMs
        );

        if (!rateCheck.allowed) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED',
            remaining: rateCheck.remaining,
            resetTime: rateCheck.resetTime
          });
        }
      }

      // Execute enforcement function
      const result = await enforcementFn(req);
      
      // Send standardized response
      await sendEnforcementResult(req, res, result, options.operation);

    } catch (error) {
      console.error(`Error in enforcement handler for ${options.operation}:`, error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'ENFORCEMENT_ERROR'
      });
    }
  };
}
