/**
 * Safe Supabase Query Wrapper
 * Provides type-safe database operations with enhanced error handling
 * Replaces type assertions with proper error handling
 */

/**
 * Safe Supabase query wrapper to handle type assertion issues
 * Provides better error handling for type mismatches and database errors
 * 
 * @param queryBuilder - Supabase query builder (not awaited)
 * @param fallbackValue - Value to return if query fails
 * @param context - Context string for logging purposes
 * @returns Promise with data and error
 */
export async function safeSupabaseQuery<T>(
  queryBuilder: any,
  fallbackValue: T | null = null,
  context: string = 'query'
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error(`Supabase ${context} error:`, error);
      
      // Enhanced error message based on error type
      let errorMessage = 'Database query failed';
      
      // Handle specific Supabase error codes
      if (error.code === 'PGRST116') {
        errorMessage = 'No data found';
      } else if (error.code === 'PGRST301') {
        errorMessage = 'Query completed but may take time to reflect changes';
      } else if (error.code === '23505') {
        errorMessage = 'Duplicate data - this value already exists';
      } else if (error.code === '42501') {
        errorMessage = 'Permission denied';
      } else if (error.code === '23503') {
        errorMessage = 'Referenced data does not exist';
      } else if (error.code === '23514') {
        errorMessage = 'Data validation failed';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network connection error';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out';
      } else if (error.message?.includes('JWT') || error.message?.includes('session')) {
        errorMessage = 'Session expired - please sign in again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { data: fallbackValue, error: errorMessage };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Query execution error in ${context}:`, error);
    
    // Handle different types of execution errors
    let errorMessage = 'Failed to execute query';
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network connection error';
      } else if (error.message.includes('timeout') || error.name === 'AbortError') {
        errorMessage = 'Request timed out';
      } else if (error.message.includes('JWT') || error.message.includes('session')) {
        errorMessage = 'Session expired - please sign in again';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { data: fallbackValue, error: errorMessage };
  }
}

/**
 * Safe query for single record retrieval
 * Handles the common pattern of fetching a single record with fallback
 */
export async function safeGetSingle<T>(
  queryBuilder: any,
  context: string = 'get_single'
): Promise<{ data: T | null; error: string | null; found: boolean }> {
  const result = await safeSupabaseQuery<T>(queryBuilder, null, context);
  
  return {
    ...result,
    found: result.data !== null && result.error === null
  };
}

/**
 * Safe query for list retrieval
 * Handles the common pattern of fetching multiple records with empty array fallback
 */
export async function safeGetList<T>(
  queryBuilder: any,
  context: string = 'get_list'
): Promise<{ data: T[]; error: string | null; count: number }> {
  const result = await safeSupabaseQuery<T[]>(queryBuilder, [], context);
  
  return {
    data: result.data || [],
    error: result.error,
    count: result.data?.length || 0
  };
}

/**
 * Safe query for insert operations
 * Handles insert operations with proper error handling
 */
export async function safeInsert<T>(
  queryBuilder: any,
  context: string = 'insert'
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  const result = await safeSupabaseQuery<T>(queryBuilder, null, context);
  
  return {
    ...result,
    success: result.error === null
  };
}

/**
 * Safe query for update operations
 * Handles update operations with proper error handling
 */
export async function safeUpdate<T>(
  queryBuilder: any,
  context: string = 'update'
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  const result = await safeSupabaseQuery<T>(queryBuilder, null, context);
  
  return {
    ...result,
    success: result.error === null
  };
}

/**
 * Safe query for delete operations
 * Handles delete operations with proper error handling
 */
export async function safeDelete(
  queryBuilder: any,
  context: string = 'delete'
): Promise<{ error: string | null; success: boolean }> {
  const result = await safeSupabaseQuery(queryBuilder, null, context);
  
  return {
    error: result.error,
    success: result.error === null
  };
}

/**
 * Type-safe error checking utility
 * Helps with TypeScript type narrowing for error handling
 */
export function isQueryError(result: { error: string | null }): result is { error: string } {
  return result.error !== null;
}

/**
 * Type-safe success checking utility
 * Helps with TypeScript type narrowing for success handling
 */
export function isQuerySuccess<T>(result: { data: T | null; error: string | null }): result is { data: T; error: null } {
  return result.error === null && result.data !== null;
}

/**
 * Common error patterns for easy checking
 */
export const ErrorPatterns = {
  SESSION_EXPIRED: (error: string) => error.includes('session') || error.includes('JWT'),
  NETWORK_ERROR: (error: string) => error.includes('network') || error.includes('connection'),
  PERMISSION_DENIED: (error: string) => error.includes('permission') || error.includes('42501'),
  NOT_FOUND: (error: string) => error.includes('No data found') || error.includes('PGRST116'),
  DUPLICATE_DATA: (error: string) => error.includes('already exists') || error.includes('23505'),
  TIMEOUT: (error: string) => error.includes('timeout') || error.includes('AbortError')
} as const;

export default safeSupabaseQuery;
