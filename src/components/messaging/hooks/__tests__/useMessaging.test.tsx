/**
 * useMessaging Hook Tests
 * 
 * Tests for the useMessaging custom hook including conversation management,
 * permission checking, and navigation functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useMessaging, useProfileMessaging, useMessagingButton } from '../useMessaging';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'current-user-id',
      email: 'test@example.com'
    }
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

vi.mock('@/lib/api/messaging', () => ({
  startConversation: vi.fn(),
  canInitiateConversations: vi.fn(),
  getUserMessagingPermissions: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Import mocked functions
import { startConversation, canInitiateConversations, getUserMessagingPermissions } from '@/lib/api/messaging';
import { toast } from 'sonner';

describe('useMessaging', () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  describe('useMessaging hook', () => {
    it('initializes with correct default state', () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);
      vi.mocked(getUserMessagingPermissions).mockResolvedValue({
        can_initiate: true,
        can_reply: true,
        can_admin: false,
        tier: 'Privileged',
        retention_days: 180,
        upgrade_available: false
      });

      const { result } = renderHook(() => useMessaging(), {
        wrapper: createWrapper
      });

      expect(result.current.isStarting).toBe(false);
      expect(result.current.isCheckingPermissions).toBe(true);
    });

    it('handles successful conversation start', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);
      vi.mocked(startConversation).mockResolvedValue({
        conversation_id: 'conv-123',
        is_existing: false
      });

      const { result } = renderHook(() => useMessaging(), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.isCheckingPermissions).toBe(false);
      });

      result.current.handleStartConversation('testuser');

      await waitFor(() => {
        expect(startConversation).toHaveBeenCalledWith('current-user-id', 'testuser');
      });
    });

    it('shows error toast when conversation start fails', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);
      vi.mocked(startConversation).mockRejectedValue(new Error('User not found'));

      const { result } = renderHook(() => useMessaging(), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.isCheckingPermissions).toBe(false);
      });

      result.current.handleStartConversation('nonexistentuser');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('User not found');
      });
    });

    it('prevents conversation start when user cannot initiate', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(false);

      const { result } = renderHook(() => useMessaging(), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.isCheckingPermissions).toBe(false);
      });

      result.current.handleStartConversation('testuser');

      expect(startConversation).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Upgrade to Privileged+ to start conversations');
    });

    it('handles empty username gracefully', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const { result } = renderHook(() => useMessaging(), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.isCheckingPermissions).toBe(false);
      });

      result.current.handleStartConversation('   ');

      expect(startConversation).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Username is required');
    });
  });

  describe('useProfileMessaging hook', () => {
    it('returns correct state for valid target user', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const { result } = renderHook(() => useProfileMessaging('testuser'), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.canMessage).toBe(true);
      });
    });

    it('returns false for same user (self)', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const { result } = renderHook(() => useProfileMessaging('test'), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.canMessage).toBe(false);
      });
    });

    it('handles message user action', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);
      vi.mocked(startConversation).mockResolvedValue({
        conversation_id: 'conv-123',
        is_existing: false
      });

      const { result } = renderHook(() => useProfileMessaging('testuser'), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.canMessage).toBe(true);
      });

      result.current.handleMessageUser();

      await waitFor(() => {
        expect(startConversation).toHaveBeenCalledWith('current-user-id', 'testuser');
      });
    });
  });

  describe('useMessagingButton hook', () => {
    it('returns correct button props for valid user', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const { result } = renderHook(() => useMessagingButton('testuser'), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.children).toBe('Message');
        expect(result.current.disabled).toBe(false);
        expect(result.current.variant).toBe('default');
      });
    });

    it('returns upgrade button props when user cannot initiate', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(false);

      const { result } = renderHook(() => useMessagingButton('testuser'), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.children).toBe('Upgrade to Message');
        expect(result.current.disabled).toBe(false);
        expect(result.current.variant).toBe('outline');
      });
    });

    it('returns disabled button props when no target username', () => {
      const { result } = renderHook(() => useMessagingButton(), {
        wrapper: createWrapper
      });

      expect(result.current.children).toBe('Message');
      expect(result.current.disabled).toBe(true);
      expect(result.current.variant).toBe('outline');
    });

    it('returns loading state when starting conversation', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);
      vi.mocked(startConversation).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { result } = renderHook(() => useMessagingButton('testuser'), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.disabled).toBe(false);
      });

      // Trigger conversation start
      result.current.onClick();

      await waitFor(() => {
        expect(result.current.children).toBe('Starting...');
        expect(result.current.disabled).toBe(true);
      });
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      vi.mocked(canInitiateConversations).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMessaging(), {
        wrapper: createWrapper
      });

      // Should not crash and should handle the error
      await waitFor(() => {
        expect(result.current.isCheckingPermissions).toBe(false);
      });
    });

    it('handles missing user context', () => {
      // Mock useAuth to return no user
      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: () => ({ user: null })
      }));

      const { result } = renderHook(() => useMessaging(), {
        wrapper: createWrapper
      });

      // Should handle gracefully without crashing
      expect(result.current.canInitiate).toBeUndefined();
    });
  });
});
