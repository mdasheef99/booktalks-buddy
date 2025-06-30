/**
 * Utils Index Module Tests
 * Tests for convenience functions and integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isUserParticipant,
  validateStoreContext,
  validateUser
} from '../index';

// Mock the individual modules
vi.mock('../conversation-helpers', () => ({
  isUserInConversation: vi.fn()
}));

vi.mock('../store-context', () => ({
  getUserStoreId: vi.fn()
}));

vi.mock('../validation', () => ({
  validateUserId: vi.fn()
}));

describe('Utils Index Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isUserParticipant', () => {
    it('should call isUserInConversation with correct parameters', async () => {
      const { isUserInConversation } = await import('../conversation-helpers');
      (isUserInConversation as any).mockResolvedValue(true);

      const result = await isUserParticipant('conv-123', 'user-123');
      
      expect(isUserInConversation).toHaveBeenCalledWith('user-123', 'conv-123');
      expect(result).toBe(true);
    });
  });

  describe('validateStoreContext', () => {
    it('should return true when user has store context', async () => {
      const { getUserStoreId } = await import('../store-context');
      (getUserStoreId as any).mockResolvedValue('store-123');

      const result = await validateStoreContext('user-123');
      
      expect(getUserStoreId).toHaveBeenCalledWith('user-123');
      expect(result).toBe(true);
    });

    it('should return false when user has no store context', async () => {
      const { getUserStoreId } = await import('../store-context');
      (getUserStoreId as any).mockResolvedValue(null);

      const result = await validateStoreContext('user-123');
      
      expect(getUserStoreId).toHaveBeenCalledWith('user-123');
      expect(result).toBe(false);
    });
  });

  describe('validateUser', () => {
    it('should return true when user ID is valid and has store context', async () => {
      const { validateUserId } = await import('../validation');
      const { getUserStoreId } = await import('../store-context');
      
      (validateUserId as any).mockReturnValue({ valid: true });
      (getUserStoreId as any).mockResolvedValue('store-123');

      const result = await validateUser('123e4567-e89b-12d3-a456-426614174000');
      
      expect(validateUserId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(getUserStoreId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBe(true);
    });

    it('should return false when user ID is invalid', async () => {
      const { validateUserId } = await import('../validation');
      
      (validateUserId as any).mockReturnValue({ 
        valid: false, 
        error: 'Invalid user ID format' 
      });

      const result = await validateUser('invalid-id');
      
      expect(validateUserId).toHaveBeenCalledWith('invalid-id');
      expect(result).toBe(false);
    });

    it('should return false when user ID is valid but has no store context', async () => {
      const { validateUserId } = await import('../validation');
      const { getUserStoreId } = await import('../store-context');
      
      (validateUserId as any).mockReturnValue({ valid: true });
      (getUserStoreId as any).mockResolvedValue(null);

      const result = await validateUser('123e4567-e89b-12d3-a456-426614174000');
      
      expect(validateUserId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(getUserStoreId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBe(false);
    });
  });
});
