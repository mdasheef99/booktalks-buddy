/**
 * Store Context Module Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserStoreId, areUsersInSameStore, getUserStoreContext } from '../store-context';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('Store Context Module', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { supabase } = await import('@/lib/supabase');
    mockSupabase = supabase;
  });

  describe('getUserStoreId', () => {
    it('should return store ID for valid user', async () => {
      const mockData = {
        book_clubs: {
          store_id: 'store-123'
        }
      };

      mockSupabase.from().select().eq().limit().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getUserStoreId('user-123');
      expect(result).toBe('store-123');
    });

    it('should return null when user has no store context', async () => {
      mockSupabase.from().select().eq().limit().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      });

      const result = await getUserStoreId('user-123');
      expect(result).toBeNull();
    });

    it('should return null when database error occurs', async () => {
      mockSupabase.from().select().eq().limit().single.mockRejectedValue(
        new Error('Database error')
      );

      const result = await getUserStoreId('user-123');
      expect(result).toBeNull();
    });

    it('should handle missing book_clubs data', async () => {
      const mockData = {
        book_clubs: null
      };

      mockSupabase.from().select().eq().limit().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getUserStoreId('user-123');
      expect(result).toBeNull();
    });
  });

  describe('areUsersInSameStore', () => {
    it('should return true when users are in same store', async () => {
      const mockData = {
        book_clubs: {
          store_id: 'store-123'
        }
      };

      mockSupabase.from().select().eq().limit().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await areUsersInSameStore('user-1', 'user-2');
      expect(result).toBe(true);
    });

    it('should return false when users are in different stores', async () => {
      mockSupabase.from().select().eq().limit().single
        .mockResolvedValueOnce({
          data: { book_clubs: { store_id: 'store-123' } },
          error: null
        })
        .mockResolvedValueOnce({
          data: { book_clubs: { store_id: 'store-456' } },
          error: null
        });

      const result = await areUsersInSameStore('user-1', 'user-2');
      expect(result).toBe(false);
    });

    it('should return false when one user has no store context', async () => {
      mockSupabase.from().select().eq().limit().single
        .mockResolvedValueOnce({
          data: { book_clubs: { store_id: 'store-123' } },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'No rows returned' }
        });

      const result = await areUsersInSameStore('user-1', 'user-2');
      expect(result).toBe(false);
    });
  });

  describe('getUserStoreContext', () => {
    it('should return store context with store details', async () => {
      const mockData = {
        book_clubs: {
          store_id: 'store-123',
          stores: {
            id: 'store-123',
            name: 'Test Store'
          }
        }
      };

      mockSupabase.from().select().eq().limit().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getUserStoreContext('user-123');
      expect(result).toEqual({
        store_id: 'store-123',
        store_name: 'Test Store'
      });
    });

    it('should return null when no store context found', async () => {
      mockSupabase.from().select().eq().limit().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      });

      const result = await getUserStoreContext('user-123');
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq().limit().single.mockRejectedValue(
        new Error('Database error')
      );

      const result = await getUserStoreContext('user-123');
      expect(result).toBeNull();
    });
  });
});
