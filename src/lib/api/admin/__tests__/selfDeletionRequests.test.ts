/**
 * Self-Deletion Requests API Tests
 * 
 * Tests the core functionality of the self-deletion request system:
 * - Creating deletion requests
 * - Fetching requests for admins
 * - Processing deletion requests
 * - Club ownership validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  createSelfDeletionRequest,
  getSelfDeletionRequests,
  processSelfDeletionRequest,
  deleteSelfDeletionRequest,
  checkUserClubOwnership
} from '../selfDeletionRequests';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        order: vi.fn(() => ({
          single: vi.fn()
        })),
        single: vi.fn()
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

// Mock deleteUser function
vi.mock('../accountManagement', () => ({
  deleteUser: vi.fn()
}));

describe('Self-Deletion Requests API', () => {
  const mockUserId = 'user-123';
  const mockRequestId = 'request-456';
  const mockAdminId = 'admin-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSelfDeletionRequest', () => {
    it('should create a deletion request successfully', async () => {
      const mockClubs = [
        { id: 'club-1', name: 'Book Club 1' },
        { id: 'club-2', name: 'Book Club 2' }
      ];

      // Mock book clubs query
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockClubs,
            error: null
          }))
        }))
      }));

      // Mock insertion
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: mockRequestId },
            error: null
          }))
        }))
      }));

      (supabase.from as any)
        .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: mockClubs, error: null })) })) })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await createSelfDeletionRequest(mockUserId, 'Test reason');

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    it('should handle club fetch errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      });

      const result = await createSelfDeletionRequest(mockUserId, 'Test reason');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Could not fetch owned clubs');
    });

    it('should handle insertion errors', async () => {
      const mockClubs = [{ id: 'club-1', name: 'Book Club 1' }];

      // Mock successful club fetch first
      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: mockClubs, error: null }))
          }))
        })
        // Then mock failed insertion (direct insert, not chained)
        .mockReturnValueOnce({
          insert: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insert failed' }
          }))
        });

      const result = await createSelfDeletionRequest(mockUserId, 'Test reason');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create deletion request');
    });
  });

  describe('getSelfDeletionRequests', () => {
    it('should fetch deletion requests successfully', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          user_id: 'user-1',
          reason: 'Test reason',
          clubs_owned: [{ id: 'club-1', name: 'Club 1' }],
          created_at: '2024-01-01T00:00:00Z',
          users: {
            displayname: 'Test User',
            email: 'test@example.com'
          }
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockRequests,
            error: null
          }))
        }))
      });

      const result = await getSelfDeletionRequests();

      expect(result).toHaveLength(1);
      expect(result[0].user_name).toBe('Test User');
      expect(result[0].user_email).toBe('test@example.com');
    });

    it('should handle fetch errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Fetch failed' }
          }))
        }))
      });

      await expect(getSelfDeletionRequests()).rejects.toThrow();
    });

    it('should handle missing user data gracefully', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          user_id: 'user-1',
          reason: 'Test reason',
          clubs_owned: [],
          created_at: '2024-01-01T00:00:00Z',
          users: null
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockRequests,
            error: null
          }))
        }))
      });

      const result = await getSelfDeletionRequests();

      expect(result[0].user_name).toBe('Unknown User');
      expect(result[0].user_email).toBe('No email');
    });
  });

  describe('checkUserClubOwnership', () => {
    it('should return true when user owns clubs', async () => {
      const mockClubs = [
        { id: 'club-1', name: 'Club 1' },
        { id: 'club-2', name: 'Club 2' }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockClubs,
            error: null
          }))
        }))
      });

      const result = await checkUserClubOwnership(mockUserId);

      expect(result.ownsClubs).toBe(true);
      expect(result.clubs).toEqual(mockClubs);
    });

    it('should return false when user owns no clubs', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      });

      const result = await checkUserClubOwnership(mockUserId);

      expect(result.ownsClubs).toBe(false);
      expect(result.clubs).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      });

      const result = await checkUserClubOwnership(mockUserId);

      expect(result.ownsClubs).toBe(false);
      expect(result.clubs).toEqual([]);
    });
  });

  describe('processSelfDeletionRequest', () => {
    it('should process deletion successfully when user owns no clubs', async () => {
      const mockRequest = {
        user_id: mockUserId,
        reason: 'Test reason'
      };

      // Mock request fetch
      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockRequest,
                error: null
              }))
            }))
          }))
        })
        // Mock club ownership check (no clubs)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        })
        // Mock request deletion
        .mockReturnValueOnce({
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              error: null
            }))
          }))
        });

      const { deleteUser } = await import('../accountManagement');
      (deleteUser as any).mockResolvedValue(undefined);

      const result = await processSelfDeletionRequest(mockRequestId, mockAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
      expect(deleteUser).toHaveBeenCalledWith(mockAdminId, mockUserId, expect.any(Object));
    });

    it('should fail when user still owns clubs', async () => {
      const mockRequest = {
        user_id: mockUserId,
        reason: 'Test reason'
      };

      const mockClubs = [{ id: 'club-1', name: 'Club 1' }];

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockRequest,
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: mockClubs,
              error: null
            }))
          }))
        });

      const result = await processSelfDeletionRequest(mockRequestId, mockAdminId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('still owns clubs');
    });

    it('should handle missing request', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Not found' }
            }))
          }))
        }))
      });

      const result = await processSelfDeletionRequest(mockRequestId, mockAdminId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('deleteSelfDeletionRequest', () => {
    it('should delete request successfully', async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            error: null
          }))
        }))
      });

      const result = await deleteSelfDeletionRequest(mockRequestId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    it('should handle deletion errors', async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            error: { message: 'Delete failed' }
          }))
        }))
      });

      const result = await deleteSelfDeletionRequest(mockRequestId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to reject deletion request');
    });
  });
});
