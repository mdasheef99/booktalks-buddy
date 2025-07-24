/**
 * Self-Deletion Request Integration Tests
 * 
 * Tests the complete end-to-end flow of the self-deletion request system:
 * - User creates deletion request
 * - Admin views and processes request
 * - Database state changes correctly
 * - Security policies work as expected
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  createSelfDeletionRequest,
  getSelfDeletionRequests,
  processSelfDeletionRequest,
  checkUserClubOwnership
} from '@/lib/api/admin/selfDeletionRequests';

// Mock the entire supabase module for integration testing
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      uid: vi.fn()
    }
  };
  return { supabase: mockSupabase };
});

// Mock account management
vi.mock('@/lib/api/admin/accountManagement', () => ({
  deleteUser: vi.fn()
}));

describe('Self-Deletion Request Integration Flow', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    displayname: 'Test User'
  };

  const mockAdmin = {
    id: 'admin-456',
    email: 'admin@example.com'
  };

  const mockClubs = [
    { id: 'club-1', name: 'Book Club Alpha' },
    { id: 'club-2', name: 'Reading Circle Beta' }
  ];

  let mockDatabase: any = {};

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock database
    mockDatabase = {
      self_deletion_requests: [],
      book_clubs: mockClubs.map(club => ({ ...club, lead_user_id: mockUser.id })),
      users: [mockUser, mockAdmin]
    };

    // Setup supabase mock
    (supabase.from as any).mockImplementation((table: string) => {
      return {
        select: vi.fn((columns?: string) => ({
          eq: vi.fn((column: string, value: any) => {
            if (table === 'book_clubs' && column === 'lead_user_id') {
              const clubs = mockDatabase.book_clubs.filter((club: any) => club.lead_user_id === value);
              return Promise.resolve({ data: clubs, error: null });
            }
            if (table === 'self_deletion_requests' && column === 'id') {
              const request = mockDatabase.self_deletion_requests.find((req: any) => req.id === value);
              return { 
                single: vi.fn(() => Promise.resolve({ data: request, error: request ? null : { message: 'Not found' } }))
              };
            }
            return Promise.resolve({ data: [], error: null });
          }),
          order: vi.fn(() => Promise.resolve({ 
            data: mockDatabase.self_deletion_requests, 
            error: null 
          })),
          single: vi.fn(() => {
            const item = mockDatabase[table]?.[0];
            return Promise.resolve({ data: item, error: item ? null : { message: 'Not found' } });
          })
        })),
        insert: vi.fn((data: any) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              const newItem = { id: `${table}-${Date.now()}`, ...data[0] };
              mockDatabase[table] = mockDatabase[table] || [];
              mockDatabase[table].push(newItem);
              return Promise.resolve({ data: newItem, error: null });
            })
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn((column: string, value: any) => {
            if (mockDatabase[table]) {
              mockDatabase[table] = mockDatabase[table].filter((item: any) => item[column] !== value);
            }
            return Promise.resolve({ error: null });
          })
        }))
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Flow', () => {
    it('should handle user with clubs requesting deletion', async () => {
      // Step 1: User creates deletion request
      const createResult = await createSelfDeletionRequest(
        mockUser.id, 
        'No longer need the service'
      );

      expect(createResult.success).toBe(true);
      expect(createResult.message).toContain('successfully');
      expect(mockDatabase.self_deletion_requests).toHaveLength(1);

      // Step 2: Check that request contains club information
      const request = mockDatabase.self_deletion_requests[0];
      expect(request.user_id).toBe(mockUser.id);
      expect(request.reason).toBe('No longer need the service');
      expect(request.clubs_owned).toEqual(mockClubs);

      // Step 3: Admin tries to process request (should fail - user still owns clubs)
      const processResult = await processSelfDeletionRequest(request.id, mockAdmin.id);
      
      expect(processResult.success).toBe(false);
      expect(processResult.message).toContain('still owns clubs');
      expect(mockDatabase.self_deletion_requests).toHaveLength(1); // Request still exists
    });

    it('should handle user without clubs requesting deletion', async () => {
      // Setup: User owns no clubs
      mockDatabase.book_clubs = [];

      // Step 1: User creates deletion request
      const createResult = await createSelfDeletionRequest(
        mockUser.id, 
        'Moving to different platform'
      );

      expect(createResult.success).toBe(true);
      expect(mockDatabase.self_deletion_requests).toHaveLength(1);

      const request = mockDatabase.self_deletion_requests[0];
      expect(request.clubs_owned).toEqual([]);

      // Step 2: Admin processes request (should succeed)
      const { deleteUser } = await import('@/lib/api/admin/accountManagement');
      (deleteUser as any).mockResolvedValue(undefined);

      const processResult = await processSelfDeletionRequest(request.id, mockAdmin.id);
      
      expect(processResult.success).toBe(true);
      expect(processResult.message).toContain('successfully');
      expect(deleteUser).toHaveBeenCalledWith(
        mockAdmin.id, 
        mockUser.id, 
        expect.objectContaining({
          reason: expect.stringContaining('Moving to different platform'),
          backup_data: true
        })
      );
      expect(mockDatabase.self_deletion_requests).toHaveLength(0); // Request removed
    });

    it('should handle club ownership transfer workflow', async () => {
      // Step 1: User with clubs creates deletion request
      await createSelfDeletionRequest(mockUser.id, 'Test reason');
      const request = mockDatabase.self_deletion_requests[0];

      // Step 2: Admin attempts deletion (fails)
      let processResult = await processSelfDeletionRequest(request.id, mockAdmin.id);
      expect(processResult.success).toBe(false);

      // Step 3: Simulate club ownership transfer (remove clubs from user)
      mockDatabase.book_clubs = mockDatabase.book_clubs.map((club: any) => ({
        ...club,
        lead_user_id: 'new-owner-789' // Transferred to someone else
      }));

      // Step 4: Admin processes deletion again (should succeed)
      const { deleteUser } = await import('@/lib/api/admin/accountManagement');
      (deleteUser as any).mockResolvedValue(undefined);

      processResult = await processSelfDeletionRequest(request.id, mockAdmin.id);
      
      expect(processResult.success).toBe(true);
      expect(deleteUser).toHaveBeenCalled();
      expect(mockDatabase.self_deletion_requests).toHaveLength(0);
    });
  });

  describe('Club Ownership Validation', () => {
    it('should correctly identify users with clubs', async () => {
      const result = await checkUserClubOwnership(mockUser.id);
      
      expect(result.ownsClubs).toBe(true);
      expect(result.clubs).toEqual(mockClubs);
    });

    it('should correctly identify users without clubs', async () => {
      mockDatabase.book_clubs = [];
      
      const result = await checkUserClubOwnership(mockUser.id);
      
      expect(result.ownsClubs).toBe(false);
      expect(result.clubs).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      }));

      const result = await checkUserClubOwnership(mockUser.id);
      
      expect(result.ownsClubs).toBe(false);
      expect(result.clubs).toEqual([]);
    });
  });

  describe('Admin Request Management', () => {
    beforeEach(async () => {
      // Create some test requests
      await createSelfDeletionRequest(mockUser.id, 'Reason 1');
      await createSelfDeletionRequest('user-789', 'Reason 2');
    });

    it('should fetch all deletion requests for admin', async () => {
      // Mock the join query for getSelfDeletionRequests
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'self_deletion_requests') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockDatabase.self_deletion_requests.map((req: any) => ({
                  ...req,
                  users: { displayname: 'Test User', email: 'test@example.com' }
                })),
                error: null
              }))
            }))
          };
        }
        return { select: vi.fn() };
      });

      const requests = await getSelfDeletionRequests();
      
      expect(requests).toHaveLength(2);
      expect(requests[0].user_name).toBe('Test User');
      expect(requests[0].user_email).toBe('test@example.com');
    });

    it('should handle empty request list', async () => {
      mockDatabase.self_deletion_requests = [];
      
      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }));

      const requests = await getSelfDeletionRequests();
      
      expect(requests).toHaveLength(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle request creation failures', async () => {
      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: mockClubs, error: null }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Insert failed' }
            }))
          }))
        }))
      }));

      const result = await createSelfDeletionRequest(mockUser.id, 'Test reason');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create deletion request');
    });

    it('should handle processing non-existent requests', async () => {
      const result = await processSelfDeletionRequest('non-existent-id', mockAdmin.id);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle account deletion failures', async () => {
      mockDatabase.book_clubs = []; // User owns no clubs
      await createSelfDeletionRequest(mockUser.id, 'Test reason');
      const request = mockDatabase.self_deletion_requests[0];

      const { deleteUser } = await import('@/lib/api/admin/accountManagement');
      (deleteUser as any).mockRejectedValue(new Error('Account deletion failed'));

      const result = await processSelfDeletionRequest(request.id, mockAdmin.id);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process deletion');
    });
  });
});
