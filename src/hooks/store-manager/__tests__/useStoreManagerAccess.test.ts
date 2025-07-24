/**
 * Test file for useStoreManagerAccess hook
 * Validates Store Manager role detection, store context retrieval, and entitlements mapping
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useStoreManagerAccess, useStoreManagerValidation, useStoreManagerEntitlements } from '../useStoreManagerAccess';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { STORE_MANAGER_ENTITLEMENTS } from '@/lib/entitlements/constants';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/supabase');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useStoreManagerAccess', () => {
  const mockUser = {
    id: '192ea974-1770-4b03-9dba-cc8121525c57',
    email: 'kafka@bookconnect.com'
  };

  const mockStoreAdmin = {
    store_id: 'ce76b99a-5f1a-481a-af85-862e584465e1',
    role: 'manager',
    stores: {
      id: 'ce76b99a-5f1a-481a-af85-862e584465e1',
      name: 'Default Store'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect Store Manager role correctly', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStoreAdmin,
              error: null
            })
          })
        })
      })
    } as any);

    const { result } = renderHook(() => useStoreManagerAccess());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isStoreManager).toBe(true);
    expect(result.current.storeId).toBe('ce76b99a-5f1a-481a-af85-862e584465e1');
    expect(result.current.storeName).toBe('Default Store');
    expect(result.current.error).toBe(null);
  });

  it('should handle non-Store Manager users correctly', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      })
    } as any);

    const { result } = renderHook(() => useStoreManagerAccess());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isStoreManager).toBe(false);
    expect(result.current.storeId).toBe(null);
    expect(result.current.storeName).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle unauthenticated users', () => {
    mockUseAuth.mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useStoreManagerAccess());

    expect(result.current.isStoreManager).toBe(false);
    expect(result.current.storeId).toBe(null);
    expect(result.current.storeName).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});

describe('useStoreManagerEntitlements', () => {
  it('should return correct entitlements for Store Manager', () => {
    // Mock the useStoreManagerAccess hook to return Store Manager status
    jest.doMock('../useStoreManagerAccess', () => ({
      useStoreManagerAccess: () => ({
        isStoreManager: true,
        storeId: 'ce76b99a-5f1a-481a-af85-862e584465e1',
        storeName: 'Default Store',
        loading: false,
        error: null
      })
    }));

    const { result } = renderHook(() => useStoreManagerEntitlements());

    expect(result.current.canViewAllMembers).toBe(true);
    expect(result.current.canManageAllClubs).toBe(true);
    expect(result.current.canModerateContent).toBe(true);
    expect(result.current.canManageEvents).toBe(true);
    expect(result.current.hasStoreAccess).toBe(true);
    expect(result.current.entitlements).toEqual(STORE_MANAGER_ENTITLEMENTS);
  });
});
