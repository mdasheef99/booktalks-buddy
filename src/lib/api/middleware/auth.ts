/**
 * Secure Authentication Middleware for BookTalks Buddy API Routes
 * 
 * This middleware provides proper server-side authentication that respects
 * Row Level Security (RLS) policies instead of bypassing them with service role keys.
 * 
 * Usage Patterns:
 * - withAuth(): For authenticated endpoints requiring user session
 * - withPublicAccess(): For public read-only endpoints with RLS enforcement
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Authentication result interface
 */
interface AuthResult {
  supabase: any;
  user: any;
  session: any;
}

/**
 * Public access result interface
 */
interface PublicAccessResult {
  supabase: any;
}

/**
 * Middleware for authenticated API endpoints
 * 
 * This function creates a Supabase client that respects RLS policies
 * and validates that the user has a valid session.
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns AuthResult object or sends error response
 */
export async function withAuth(req: NextApiRequest, res: NextApiResponse): Promise<AuthResult | null> {
  try {
    // Create server-side Supabase client that respects RLS
    const supabase = createServerSupabaseClient({ req, res })
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session validation error:', sessionError)
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        details: sessionError.message
      })
      return null
    }
    
    if (!session || !session.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        details: 'No valid session found'
      })
      return null
    }
    
    // Return authenticated context
    return {
      supabase,
      user: session.user,
      session
    }
  } catch (error) {
    console.error('Authentication middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication system error',
      details: 'Internal authentication error'
    })
    return null
  }
}

/**
 * Middleware for public API endpoints
 * 
 * This function creates a Supabase client for public access that still
 * respects RLS policies but doesn't require authentication.
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns PublicAccessResult object
 */
export async function withPublicAccess(req: NextApiRequest, res: NextApiResponse): Promise<PublicAccessResult> {
  try {
    // Create server-side Supabase client for public access
    // This still respects RLS policies but doesn't require authentication
    const supabase = createServerSupabaseClient({ req, res })
    
    return { supabase }
  } catch (error) {
    console.error('Public access middleware error:', error)
    throw new Error('Failed to initialize public access')
  }
}

/**
 * Utility function to validate club ownership
 * 
 * This function checks if the authenticated user is the lead of the specified club.
 * It uses RLS-enabled queries to ensure proper access control.
 * 
 * @param supabase - RLS-enabled Supabase client
 * @param clubId - ID of the club to check
 * @param userId - ID of the user to validate
 * @returns boolean indicating if user is club lead
 */
export async function validateClubLead(supabase: any, clubId: string, userId: string): Promise<boolean> {
  try {
    const { data: club, error } = await supabase
      .from('book_clubs')
      .select('lead_user_id')
      .eq('id', clubId)
      .eq('lead_user_id', userId) // RLS will enforce this constraint
      .single()
    
    if (error) {
      console.error('Club lead validation error:', error)
      return false
    }
    
    return !!club
  } catch (error) {
    console.error('Club lead validation exception:', error)
    return false
  }
}

/**
 * Utility function to validate club member access
 * 
 * This function checks if the user has appropriate access to club data.
 * 
 * @param supabase - RLS-enabled Supabase client
 * @param clubId - ID of the club to check
 * @param userId - ID of the user to validate
 * @returns object with access level information
 */
export async function validateClubAccess(supabase: any, clubId: string, userId: string): Promise<{
  hasAccess: boolean;
  role?: string;
  isLead: boolean;
  isMember: boolean;
}> {
  try {
    // Check club membership
    const { data: membership, error: memberError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single()
    
    // Check if user is club lead
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('lead_user_id')
      .eq('id', clubId)
      .single()
    
    const isLead = !clubError && club && club.lead_user_id === userId
    const isMember = !memberError && !!membership
    const hasAccess = isLead || isMember
    
    return {
      hasAccess,
      role: membership?.role,
      isLead,
      isMember
    }
  } catch (error) {
    console.error('Club access validation exception:', error)
    return {
      hasAccess: false,
      isLead: false,
      isMember: false
    }
  }
}

/**
 * Error response helper for consistent error formatting
 */
export function createErrorResponse(status: number, message: string, details?: string) {
  return {
    status,
    body: {
      success: false,
      error: message,
      ...(details && { details })
    }
  }
}

/**
 * Success response helper for consistent response formatting
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    ...(message && { message }),
    ...data
  }
}
