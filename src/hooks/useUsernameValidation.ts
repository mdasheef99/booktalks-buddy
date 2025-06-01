/**
 * Custom React Hook for Username Validation
 * 
 * Provides a clean interface for username validation with debouncing,
 * real-time feedback, and comprehensive error handling.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  validateUsername, 
  checkUsernameAvailability, 
  validateUsernameComprehensive,
  UsernameValidationResult 
} from '@/utils/usernameValidation';

export interface UseUsernameValidationOptions {
  debounceMs?: number;
  excludeUserId?: string;
  validateOnMount?: boolean;
}

export interface UseUsernameValidationReturn {
  // Validation state
  isValid: boolean;
  isChecking: boolean;
  isAvailable: boolean | null;
  errors: string[];
  suggestions: string[];
  
  // Methods
  validateUsername: (username: string) => Promise<void>;
  clearValidation: () => void;
  
  // Validation result object
  validationResult: UsernameValidationResult & { isAvailable?: boolean } | null;
}

export function useUsernameValidation(
  initialUsername: string = '',
  options: UseUsernameValidationOptions = {}
): UseUsernameValidationReturn {
  const {
    debounceMs = 500,
    excludeUserId,
    validateOnMount = false
  } = options;

  // State
  const [validationResult, setValidationResult] = useState<(UsernameValidationResult & { isAvailable?: boolean }) | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear any pending validation
  const clearPendingValidation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Clear validation state
  const clearValidation = useCallback(() => {
    clearPendingValidation();
    setValidationResult(null);
    setIsChecking(false);
  }, [clearPendingValidation]);

  // Validate username function
  const validateUsernameAsync = useCallback(async (username: string) => {
    const trimmedUsername = username.trim();
    
    // Clear previous validation
    clearPendingValidation();
    
    // Reset state for empty usernames
    if (!trimmedUsername) {
      setValidationResult(null);
      setIsChecking(false);
      return;
    }

    // Quick format validation first (immediate feedback)
    const formatValidation = validateUsername(trimmedUsername);
    if (!formatValidation.isValid) {
      setValidationResult({ ...formatValidation, isAvailable: false });
      setIsChecking(false);
      return;
    }

    // Start async validation
    setIsChecking(true);
    
    // Create abort controller for this validation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const comprehensiveResult = await validateUsernameComprehensive(trimmedUsername, excludeUserId);
      
      // Check if this validation was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      setValidationResult(comprehensiveResult);
    } catch (error) {
      // Check if this validation was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      console.error('Error validating username:', error);
      setValidationResult({
        isValid: false,
        errors: ['Unable to validate username. Please try again.'],
        isAvailable: false
      });
    } finally {
      // Only update loading state if this validation wasn't aborted
      if (!abortController.signal.aborted) {
        setIsChecking(false);
      }
    }
  }, [excludeUserId, clearPendingValidation]);

  // Debounced validation function
  const validateUsername = useCallback((username: string) => {
    clearPendingValidation();
    
    return new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        await validateUsernameAsync(username);
        resolve();
      }, debounceMs);
    });
  }, [validateUsernameAsync, debounceMs, clearPendingValidation]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount && initialUsername) {
      validateUsername(initialUsername);
    }
    
    // Cleanup on unmount
    return () => {
      clearPendingValidation();
    };
  }, [validateOnMount, initialUsername, validateUsername, clearPendingValidation]);

  // Derived state
  const isValid = validationResult?.isValid ?? false;
  const isAvailable = validationResult?.isAvailable ?? null;
  const errors = validationResult?.errors ?? [];
  const suggestions = validationResult?.suggestions ?? [];

  return {
    // State
    isValid,
    isChecking,
    isAvailable,
    errors,
    suggestions,
    
    // Methods
    validateUsername,
    clearValidation,
    
    // Full validation result
    validationResult
  };
}

/**
 * Simplified hook for basic username validation without debouncing
 */
export function useUsernameValidationSync(username: string, excludeUserId?: string) {
  const [result, setResult] = useState<UsernameValidationResult | null>(null);
  
  useEffect(() => {
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setResult(null);
      return;
    }
    
    // Only format validation (synchronous)
    const formatResult = validateUsername(trimmedUsername);
    setResult(formatResult);
  }, [username]);
  
  return {
    isValid: result?.isValid ?? false,
    errors: result?.errors ?? [],
    suggestions: result?.suggestions ?? [],
    validationResult: result
  };
}

/**
 * Hook specifically for checking username availability
 */
export function useUsernameAvailability(username: string, excludeUserId?: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const trimmedUsername = username.trim();
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset state for empty usernames
    if (!trimmedUsername) {
      setIsAvailable(null);
      setIsChecking(false);
      setError(null);
      return;
    }
    
    // Check format first
    const formatValidation = validateUsername(trimmedUsername);
    if (!formatValidation.isValid) {
      setIsAvailable(false);
      setIsChecking(false);
      setError(formatValidation.errors[0] || 'Invalid format');
      return;
    }
    
    // Debounced availability check
    timeoutRef.current = setTimeout(async () => {
      setIsChecking(true);
      setError(null);
      
      try {
        const available = await checkUsernameAvailability(trimmedUsername, excludeUserId);
        setIsAvailable(available);
      } catch (err) {
        console.error('Error checking username availability:', err);
        setError('Unable to check availability');
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [username, excludeUserId]);
  
  return {
    isAvailable,
    isChecking,
    error
  };
}
