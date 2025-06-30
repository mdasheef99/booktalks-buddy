/**
 * Validation Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateMessageContent,
  validateUsername,
  validateUserId,
  validateConversationId,
  validateStoreId
} from '../validation';

describe('Validation Module', () => {
  describe('validateMessageContent', () => {
    it('should validate correct message content', () => {
      const result = validateMessageContent('Hello, this is a valid message!');
      expect(result.valid).toBe(true);
    });

    it('should reject empty content', () => {
      const result = validateMessageContent('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message content is required');
    });

    it('should reject whitespace-only content', () => {
      const result = validateMessageContent('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message cannot be empty');
    });

    it('should reject null or undefined content', () => {
      const result1 = validateMessageContent(null as any);
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Message content is required');

      const result2 = validateMessageContent(undefined as any);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Message content is required');
    });

    it('should reject non-string content', () => {
      const result = validateMessageContent(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message content is required');
      expect(result.details?.provided).toBe('number');
    });

    it('should reject content that is too long', () => {
      const longContent = 'a'.repeat(1001);
      const result = validateMessageContent(longContent);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message too long (maximum 1000 characters)');
      expect(result.details?.length).toBe(1001);
      expect(result.details?.max).toBe(1000);
    });

    it('should reject content with script tags', () => {
      const result = validateMessageContent('Hello <script>alert("xss")</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message contains invalid content');
      expect(result.details?.reason).toBe('potential_script_injection');
    });

    it('should reject content with javascript: protocol', () => {
      const result = validateMessageContent('Click here: javascript:alert("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message contains invalid content');
      expect(result.details?.reason).toBe('potential_script_injection');
    });

    it('should accept content at maximum length', () => {
      const maxContent = 'a'.repeat(1000);
      const result = validateMessageContent(maxContent);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUsername', () => {
    it('should validate correct username', () => {
      const result = validateUsername('validuser123');
      expect(result.valid).toBe(true);
    });

    it('should reject empty username', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Username is required');
    });

    it('should reject null or undefined username', () => {
      const result1 = validateUsername(null as any);
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Username is required');

      const result2 = validateUsername(undefined as any);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Username is required');
    });

    it('should reject username that is too short', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Username must be between 3 and 50 characters');
      expect(result.details?.length).toBe(2);
    });

    it('should reject username that is too long', () => {
      const longUsername = 'a'.repeat(51);
      const result = validateUsername(longUsername);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Username must be between 3 and 50 characters');
      expect(result.details?.length).toBe(51);
    });

    it('should accept username at minimum length', () => {
      const result = validateUsername('abc');
      expect(result.valid).toBe(true);
    });

    it('should accept username at maximum length', () => {
      const maxUsername = 'a'.repeat(50);
      const result = validateUsername(maxUsername);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUserId', () => {
    it('should validate correct UUID', () => {
      const result = validateUserId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const result = validateUserId('invalid-uuid');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid user ID format');
      expect(result.details?.format).toBe('Expected UUID format');
    });

    it('should reject empty user ID', () => {
      const result = validateUserId('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should reject null or undefined user ID', () => {
      const result1 = validateUserId(null as any);
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('User ID is required');

      const result2 = validateUserId(undefined as any);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('User ID is required');
    });
  });

  describe('validateConversationId', () => {
    it('should validate correct UUID', () => {
      const result = validateConversationId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const result = validateConversationId('invalid-uuid');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid conversation ID format');
    });
  });

  describe('validateStoreId', () => {
    it('should validate correct UUID', () => {
      const result = validateStoreId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const result = validateStoreId('invalid-uuid');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid store ID format');
    });
  });
});
