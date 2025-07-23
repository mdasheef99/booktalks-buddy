/**
 * Enhanced Form Validation Utilities
 * Provides comprehensive validation with security enhancements and user experience improvements
 */

// =====================================================
// Types and Interfaces
// =====================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export interface FieldValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => ValidationResult;
}

// =====================================================
// Security and Sanitization
// =====================================================

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Remove potentially dangerous characters
 */
export function removeDangerousChars(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove script tags, javascript:, data:, and other dangerous patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Normalize whitespace and remove multiple consecutive spaces
 */
export function normalizeWhitespace(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Comprehensive input sanitization
 */
export function sanitizeAndNormalize(input: string): string {
  return normalizeWhitespace(sanitizeInput(removeDangerousChars(input)));
}

// =====================================================
// Field-Specific Validators
// =====================================================

/**
 * Validate name fields (Full Name, Author Name)
 * - Maximum 50 characters
 * - Minimum 6 characters  
 * - Allow only letters, spaces, hyphens, and apostrophes
 */
export function validateNameField(value: string, fieldName: string = 'Name'): ValidationResult {
  const sanitized = sanitizeAndNormalize(value);
  
  if (!sanitized) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (sanitized.length < 6) {
    return { isValid: false, error: `${fieldName} must be at least 6 characters long` };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: `${fieldName} must be 50 characters or less` };
  }
  
  // Allow only letters, spaces, hyphens, and apostrophes
  const namePattern = /^[a-zA-Z\s\-']+$/;
  if (!namePattern.test(sanitized)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Validate book title field
 * - Maximum 100 characters
 * - Minimum 6 characters
 * - Allow alphanumeric characters, spaces, and common punctuation
 */
export function validateBookTitle(value: string): ValidationResult {
  const sanitized = sanitizeAndNormalize(value);
  
  if (!sanitized) {
    return { isValid: false, error: 'Book title is required' };
  }
  
  if (sanitized.length < 6) {
    return { isValid: false, error: 'Book title must be at least 6 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Book title must be 100 characters or less' };
  }
  
  // Allow alphanumeric characters, spaces, and common punctuation
  const titlePattern = /^[a-zA-Z0-9\s\.,!?:;\-']+$/;
  if (!titlePattern.test(sanitized)) {
    return { isValid: false, error: 'Book title contains invalid characters' };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Validate phone number field
 * - Exactly 10 digits
 * - Strip all non-numeric characters before validation
 */
export function validatePhoneNumber(value: string): ValidationResult {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Strip all non-numeric characters
  const digitsOnly = value.replace(/\D/g, '');
  
  if (digitsOnly.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }
  
  return { isValid: true, sanitizedValue: digitsOnly };
}

/**
 * Validate email field
 * - Standard email format validation
 * - Maximum 254 characters (RFC standard)
 */
export function validateEmail(value: string): ValidationResult {
  const sanitized = sanitizeAndNormalize(value);
  
  if (!sanitized) {
    return { isValid: false, error: 'Email address is required' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email address must be 254 characters or less' };
  }
  
  // RFC 5322 compliant email regex (simplified but robust)
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailPattern.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Validate optional text field with character limits
 */
export function validateOptionalText(value: string, maxLength: number, fieldName: string): ValidationResult {
  if (!value) {
    return { isValid: true, sanitizedValue: '' };
  }
  
  const sanitized = sanitizeAndNormalize(value);
  
  if (sanitized.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be ${maxLength} characters or less` };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
}

// =====================================================
// Debouncing Utility
// =====================================================

/**
 * Debounce function for real-time validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// =====================================================
// Character Counter Utility
// =====================================================

/**
 * Get character count information for display
 */
export function getCharacterCount(value: string, maxLength: number) {
  const length = value ? value.length : 0;
  const remaining = maxLength - length;
  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;
  
  return {
    current: length,
    max: maxLength,
    remaining,
    isNearLimit,
    isOverLimit,
    percentage: (length / maxLength) * 100
  };
}

// =====================================================
// Rate Limiting Utility
// =====================================================

/**
 * Simple client-side rate limiting for form submissions
 */
export class SubmissionThrottle {
  private lastSubmission: number = 0;
  private readonly cooldownMs: number;
  
  constructor(cooldownSeconds: number = 5) {
    this.cooldownMs = cooldownSeconds * 1000;
  }
  
  canSubmit(): boolean {
    const now = Date.now();
    return now - this.lastSubmission >= this.cooldownMs;
  }
  
  recordSubmission(): void {
    this.lastSubmission = Date.now();
  }
  
  getRemainingCooldown(): number {
    const now = Date.now();
    const elapsed = now - this.lastSubmission;
    const remaining = Math.max(0, this.cooldownMs - elapsed);
    return Math.ceil(remaining / 1000);
  }
}
