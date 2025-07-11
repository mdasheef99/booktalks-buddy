/**
 * Authentication Core Module Tests
 * 
 * Unit tests for the core authentication functions extracted from AuthContext.
 * Tests sign in, sign up, and sign out functionality.
 * 
 * Created: 2025-01-11
 * Part of: AuthContext System Refactoring Validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signIn, signUp, signOut } from './authentication';
import { supabaseMock } from '@/test/setup';
import type { User } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/entitlements/cache', () => ({
  invalidateUserEntitlements: vi.fn(),
}));

vi.mock('@/lib/api/subscriptions/cache', () => ({
  invalidateOnSubscriptionEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Authentication Core Module', () => {
  const mockSetLoading = vi.fn();
  const mockNavigate = vi.fn();
  const mockSetEntitlements = vi.fn();
  const mockSetSubscriptionStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('signIn()', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      };

      supabaseMock.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      await signIn('test@example.com', 'password123', mockSetLoading);

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle sign in errors', async () => {
      supabaseMock.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      const { toast } = await import('sonner');

      await signIn('test@example.com', 'wrongpassword', mockSetLoading);

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle unexpected errors', async () => {
      supabaseMock.auth.signInWithPassword = vi.fn().mockRejectedValue(
        new Error('Network error')
      );

      const { toast } = await import('sonner');

      await signIn('test@example.com', 'password123', mockSetLoading);

      expect(toast.error).toHaveBeenCalledWith('Network error');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should show success toast on successful sign in', async () => {
      supabaseMock.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' }, session: null },
        error: null
      });

      const { toast } = await import('sonner');

      await signIn('test@example.com', 'password123', mockSetLoading);

      expect(toast.success).toHaveBeenCalledWith('Successfully signed in!');
    });
  });

  describe('signUp()', () => {
    it('should sign up successfully with valid data', async () => {
      const mockUser: User = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: { username: 'newuser' },
        aud: 'authenticated',
        role: 'authenticated'
      };

      supabaseMock.auth.signUp = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      await signUp(
        'newuser@example.com',
        'password123',
        'newuser',
        mockSetLoading,
        mockNavigate
      );

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(supabaseMock.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            username: 'newuser'
          }
        }
      });
      expect(mockNavigate).toHaveBeenCalledWith('/book-club');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle sign up errors', async () => {
      supabaseMock.auth.signUp = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      });

      const { toast } = await import('sonner');

      await signUp(
        'existing@example.com',
        'password123',
        'existing',
        mockSetLoading,
        mockNavigate
      );

      expect(toast.error).toHaveBeenCalledWith('Email already registered');
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should show success toast and navigate on successful sign up', async () => {
      supabaseMock.auth.signUp = vi.fn().mockResolvedValue({
        data: { user: { id: 'new-user-123' }, session: null },
        error: null
      });

      const { toast } = await import('sonner');

      await signUp(
        'newuser@example.com',
        'password123',
        'newuser',
        mockSetLoading,
        mockNavigate
      );

      expect(toast.success).toHaveBeenCalledWith('Account created! Welcome to BookConnect!');
      expect(mockNavigate).toHaveBeenCalledWith('/book-club');
    });
  });

  describe('signOut()', () => {
    it('should sign out successfully and clear state', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      };

      supabaseMock.auth.signOut = vi.fn().mockResolvedValue({
        error: null
      });

      const { invalidateUserEntitlements } = await import('@/lib/entitlements/cache');
      const { invalidateOnSubscriptionEvent } = await import('@/lib/api/subscriptions/cache');

      await signOut(
        mockUser,
        mockSetLoading,
        mockSetEntitlements,
        mockSetSubscriptionStatus,
        mockNavigate
      );

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(invalidateUserEntitlements).toHaveBeenCalledWith('user-123');
      expect(invalidateOnSubscriptionEvent).toHaveBeenCalledWith('user-123', 'subscription_expired');
      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
      expect(mockSetEntitlements).toHaveBeenCalledWith([]);
      expect(mockSetSubscriptionStatus).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle sign out with null user', async () => {
      supabaseMock.auth.signOut = vi.fn().mockResolvedValue({
        error: null
      });

      const { toast } = await import('sonner');

      await signOut(
        null,
        mockSetLoading,
        mockSetEntitlements,
        mockSetSubscriptionStatus,
        mockNavigate
      );

      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
      expect(mockSetEntitlements).toHaveBeenCalledWith([]);
      expect(mockSetSubscriptionStatus).toHaveBeenCalledWith(null);
      expect(toast.success).toHaveBeenCalledWith("You've been successfully signed out");
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle cache invalidation errors gracefully', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      };

      // Mock cache invalidation to fail
      const { invalidateOnSubscriptionEvent } = await import('@/lib/api/subscriptions/cache');
      vi.mocked(invalidateOnSubscriptionEvent).mockRejectedValue(
        new Error('Cache service unavailable')
      );

      supabaseMock.auth.signOut = vi.fn().mockResolvedValue({
        error: null
      });

      // Should not throw error
      await expect(signOut(
        mockUser,
        mockSetLoading,
        mockSetEntitlements,
        mockSetSubscriptionStatus,
        mockNavigate
      )).resolves.not.toThrow();

      // Should still complete sign out
      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle sign out errors', async () => {
      supabaseMock.auth.signOut = vi.fn().mockRejectedValue(
        new Error('Sign out failed')
      );

      const { toast } = await import('sonner');

      await signOut(
        null,
        mockSetLoading,
        mockSetEntitlements,
        mockSetSubscriptionStatus,
        mockNavigate
      );

      expect(toast.error).toHaveBeenCalledWith('Failed to sign out');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Function Signatures', () => {
    it('should maintain expected function signatures', () => {
      expect(typeof signIn).toBe('function');
      expect(signIn.length).toBe(3); // email, password, setLoading

      expect(typeof signUp).toBe('function');
      expect(signUp.length).toBe(5); // email, password, username, setLoading, navigate

      expect(typeof signOut).toBe('function');
      expect(signOut.length).toBe(5); // user, setLoading, setEntitlements, setSubscriptionStatus, navigate
    });
  });
});
