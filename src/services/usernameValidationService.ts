/**
 * Username Validation Service
 * 
 * Provides comprehensive username validation including:
 * - Format validation (existing)
 * - Uniqueness checking via database
 * - Real-time availability checking
 * - Case-insensitive comparison
 */

import { supabase } from '@/integrations/supabase/client';
import { validateUsername } from '@/utils/usernameValidation';

export interface UsernameValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
  suggestion?: string;
}

export interface UsernameAvailabilityResult {
  available: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Check if a username is available (not taken by another user)
 * Performs case-insensitive comparison
 */
export async function checkUsernameAvailability(
  username: string,
  excludeUserId?: string
): Promise<UsernameAvailabilityResult> {
  try {
    // Normalize username for comparison (lowercase, trimmed)
    const normalizedUsername = username.toLowerCase().trim();
    
    if (!normalizedUsername) {
      return {
        available: false,
        error: 'Username cannot be empty'
      };
    }

    // Query database for existing username (case-insensitive)
    let query = supabase
      .from('users')
      .select('id, username')
      .ilike('username', normalizedUsername)
      .limit(1);

    // Exclude current user if editing their own profile
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        error: 'Unable to check username availability. Please try again.'
      };
    }

    const isAvailable = !data || data.length === 0;

    // Generate suggestion if username is taken
    let suggestion: string | undefined;
    if (!isAvailable) {
      suggestion = await generateUsernameSuggestion(normalizedUsername);
    }

    return {
      available: isAvailable,
      suggestion
    };

  } catch (error) {
    console.error('Unexpected error checking username availability:', error);
    return {
      available: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Comprehensive username validation including format and availability
 */
export async function validateUsernameComprehensive(
  username: string,
  excludeUserId?: string
): Promise<UsernameValidationResult> {
  // First check format validation
  const isFormatValid = validateUsername(username);
  
  if (!isFormatValid) {
    return {
      isValid: false,
      isAvailable: false,
      error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
    };
  }

  // Then check availability
  const availabilityResult = await checkUsernameAvailability(username, excludeUserId);
  
  return {
    isValid: isFormatValid && availabilityResult.available,
    isAvailable: availabilityResult.available,
    error: availabilityResult.error || (!availabilityResult.available ? 'Username is already taken' : undefined),
    suggestion: availabilityResult.suggestion
  };
}

/**
 * Generate username suggestions when the desired username is taken
 */
async function generateUsernameSuggestion(baseUsername: string): Promise<string> {
  const suggestions = [
    `${baseUsername}_${Math.floor(Math.random() * 100)}`,
    `${baseUsername}${Math.floor(Math.random() * 1000)}`,
    `${baseUsername}_reader`,
    `${baseUsername}_book`,
    `the_${baseUsername}`,
  ];

  // Try to find an available suggestion
  for (const suggestion of suggestions) {
    const result = await checkUsernameAvailability(suggestion);
    if (result.available) {
      return suggestion;
    }
  }

  // Fallback: add random number
  return `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Debounced username availability checker for real-time validation
 */
export class DebouncedUsernameChecker {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly delay: number;

  constructor(delay: number = 500) {
    this.delay = delay;
  }

  /**
   * Check username availability with debouncing
   */
  check(
    username: string,
    callback: (result: UsernameAvailabilityResult) => void,
    excludeUserId?: string
  ): void {
    // Clear previous timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout
    this.timeoutId = setTimeout(async () => {
      const result = await checkUsernameAvailability(username, excludeUserId);
      callback(result);
    }, this.delay);
  }

  /**
   * Cancel pending check
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Hook for username validation in React components
 */
export function createUsernameValidator(excludeUserId?: string) {
  const checker = new DebouncedUsernameChecker();

  return {
    validateUsername: (username: string, callback: (result: UsernameValidationResult) => void) => {
      checker.check(username, async (availabilityResult) => {
        const isFormatValid = validateUsername(username);
        callback({
          isValid: isFormatValid && availabilityResult.available,
          isAvailable: availabilityResult.available,
          error: availabilityResult.error || (!availabilityResult.available ? 'Username is already taken' : undefined),
          suggestion: availabilityResult.suggestion
        });
      }, excludeUserId);
    },
    cancel: () => checker.cancel()
  };
}
