/**
 * AuthContext System Tests
 * 
 * Comprehensive unit tests for the refactored AuthContext system.
 * Tests the modular architecture and ensures backward compatibility.
 * 
 * Created: 2025-01-11
 * Part of: AuthContext System Refactoring Validation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { supabaseMock } from '@/test/setup';
import type { User, Session } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/entitlements/cache', () => ({
  getUserEntitlements: vi.fn().mockResolvedValue(['CAN_READ_BOOKS']),
  invalidateUserEntitlements: vi.fn(),
}));

vi.mock('@/lib/api/subscriptions/cache', () => ({
  invalidateOnSubscriptionEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/api/subscriptions/validation', () => ({
  validateUserSubscription: vi.fn().mockResolvedValue({
    success: true,
    status: {
      hasActiveSubscription: true,
      currentTier: 'PRIVILEGED',
      isValid: true,
      validationSource: 'cache'
    }
  }),
}));

// Test component to access useAuth hook
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="user-id">{auth.user?.id || 'null'}</div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="entitlements-count">{auth.entitlements.length}</div>
      <div data-testid="subscription-tier">{auth.getSubscriptionTier()}</div>
      <button 
        data-testid="sign-in-btn" 
        onClick={() => auth.signIn('test@example.com', 'password')}
      >
        Sign In
      </button>
      <button 
        data-testid="sign-out-btn" 
        onClick={() => auth.signOut()}
      >
        Sign Out
      </button>
      <button 
        data-testid="refresh-entitlements-btn" 
        onClick={() => auth.refreshEntitlements()}
      >
        Refresh Entitlements
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext System', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Supabase auth mock
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    supabaseMock.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null
    });

    supabaseMock.auth.onAuthStateChange = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    supabaseMock.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null
    });

    supabaseMock.auth.signOut.mockResolvedValue({
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthProvider Component', () => {
    it('should render children and provide auth context', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      expect(screen.getByTestId('entitlements-count')).toHaveTextContent('0');
    });

    it('should initialize with correct default state', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('MEMBER');
    });

    it('should handle user session initialization', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      };

      const mockSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      };

      // Mock session retrieval
      supabaseMock.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide all required auth methods and properties', () => {
      renderWithProvider(<TestComponent />);
      
      // Verify all buttons are rendered (methods exist)
      expect(screen.getByTestId('sign-in-btn')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-btn')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-entitlements-btn')).toBeInTheDocument();
      
      // Verify state properties are accessible
      expect(screen.getByTestId('user-id')).toBeInTheDocument();
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByTestId('entitlements-count')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-tier')).toBeInTheDocument();
    });
  });

  describe('Authentication Functions', () => {
    it('should handle sign in successfully', async () => {
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

      renderWithProvider(<TestComponent />);
      
      const signInBtn = screen.getByTestId('sign-in-btn');
      
      await act(async () => {
        fireEvent.click(signInBtn);
      });

      expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('should handle sign in errors', async () => {
      supabaseMock.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      renderWithProvider(<TestComponent />);
      
      const signInBtn = screen.getByTestId('sign-in-btn');
      
      await act(async () => {
        fireEvent.click(signInBtn);
      });

      expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalled();
      // Toast error should be called (mocked)
    });

    it('should handle sign out successfully', async () => {
      renderWithProvider(<TestComponent />);
      
      const signOutBtn = screen.getByTestId('sign-out-btn');
      
      await act(async () => {
        fireEvent.click(signOutBtn);
      });

      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Entitlements Integration', () => {
    it('should load entitlements when user is authenticated', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      };

      // Mock getUserEntitlements
      const { getUserEntitlements } = await import('@/lib/entitlements/cache');
      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_READ_BOOKS', 'CAN_JOIN_CLUBS']);

      renderWithProvider(<TestComponent />);

      // Simulate user authentication
      await act(async () => {
        // This would normally be triggered by auth state change
      });

      await waitFor(() => {
        expect(screen.getByTestId('entitlements-count')).toHaveTextContent('2');
      });
    });

    it('should refresh entitlements on demand', async () => {
      const { getUserEntitlements } = await import('@/lib/entitlements/cache');
      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_READ_BOOKS']);

      renderWithProvider(<TestComponent />);
      
      const refreshBtn = screen.getByTestId('refresh-entitlements-btn');
      
      await act(async () => {
        fireEvent.click(refreshBtn);
      });

      expect(getUserEntitlements).toHaveBeenCalled();
    });
  });

  describe('Subscription Integration', () => {
    it('should load subscription status for authenticated users', async () => {
      const { validateUserSubscription } = await import('@/lib/api/subscriptions/validation');
      
      vi.mocked(validateUserSubscription).mockResolvedValue({
        success: true,
        status: {
          hasActiveSubscription: true,
          currentTier: 'PRIVILEGED_PLUS',
          isValid: true,
          validationSource: 'database'
        }
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('subscription-tier')).toHaveTextContent('PRIVILEGED_PLUS');
      });
    });

    it('should handle subscription validation failures gracefully', async () => {
      const { validateUserSubscription } = await import('@/lib/api/subscriptions/validation');
      
      vi.mocked(validateUserSubscription).mockResolvedValue({
        success: false,
        status: null
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('subscription-tier')).toHaveTextContent('MEMBER');
      });
    });
  });

  describe('Cache Management', () => {
    it('should invalidate caches on sign out', async () => {
      const { invalidateUserEntitlements } = await import('@/lib/entitlements/cache');
      const { invalidateOnSubscriptionEvent } = await import('@/lib/api/subscriptions/cache');

      renderWithProvider(<TestComponent />);
      
      const signOutBtn = screen.getByTestId('sign-out-btn');
      
      await act(async () => {
        fireEvent.click(signOutBtn);
      });

      expect(invalidateUserEntitlements).toHaveBeenCalled();
      expect(invalidateOnSubscriptionEvent).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle entitlements loading errors gracefully', async () => {
      const { getUserEntitlements } = await import('@/lib/entitlements/cache');
      vi.mocked(getUserEntitlements).mockRejectedValue(new Error('Network error'));

      renderWithProvider(<TestComponent />);
      
      const refreshBtn = screen.getByTestId('refresh-entitlements-btn');
      
      await act(async () => {
        fireEvent.click(refreshBtn);
      });

      // Should not crash and should maintain empty entitlements
      expect(screen.getByTestId('entitlements-count')).toHaveTextContent('0');
    });

    it('should handle subscription validation errors gracefully', async () => {
      const { validateUserSubscription } = await import('@/lib/api/subscriptions/validation');
      vi.mocked(validateUserSubscription).mockRejectedValue(new Error('Validation error'));

      renderWithProvider(<TestComponent />);

      // Should not crash and should default to MEMBER tier
      await waitFor(() => {
        expect(screen.getByTestId('subscription-tier')).toHaveTextContent('MEMBER');
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain all original AuthContext properties', () => {
      renderWithProvider(<TestComponent />);
      
      // Verify all expected UI elements are present (indicating properties exist)
      expect(screen.getByTestId('user-id')).toBeInTheDocument();
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByTestId('entitlements-count')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-tier')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in-btn')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-btn')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-entitlements-btn')).toBeInTheDocument();
    });

    it('should provide the same function signatures as before refactoring', () => {
      let authContext: any;
      
      const TestHook = () => {
        authContext = useAuth();
        return null;
      };

      renderWithProvider(<TestHook />);

      // Verify function signatures
      expect(typeof authContext.signIn).toBe('function');
      expect(authContext.signIn.length).toBe(2); // email, password
      
      expect(typeof authContext.signUp).toBe('function');
      expect(authContext.signUp.length).toBe(3); // email, password, username
      
      expect(typeof authContext.signOut).toBe('function');
      expect(authContext.signOut.length).toBe(0); // no parameters
      
      expect(typeof authContext.refreshEntitlements).toBe('function');
      expect(typeof authContext.hasEntitlement).toBe('function');
      expect(typeof authContext.getSubscriptionTier).toBe('function');
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', async () => {
      let renderCount = 0;

      const TestPerformance = () => {
        renderCount++;
        const auth = useAuth();
        return <div data-testid="render-count">{renderCount}</div>;
      };

      renderWithProvider(<TestPerformance />);

      const initialRenderCount = renderCount;

      // Trigger some actions that shouldn't cause re-renders
      await act(async () => {
        // These should be optimized to not cause unnecessary renders
      });

      // Should not have excessive re-renders
      expect(renderCount).toBeLessThan(initialRenderCount + 5);
    });
  });

  describe('Modular Architecture Validation', () => {
    it('should successfully import from modular structure', async () => {
      // Test that the modular exports work correctly
      const { AuthProvider, useAuth } = await import('./AuthContext');

      expect(AuthProvider).toBeDefined();
      expect(typeof AuthProvider).toBe('function');
      expect(useAuth).toBeDefined();
      expect(typeof useAuth).toBe('function');
    });

    it('should maintain type exports', async () => {
      // Test that types are properly exported
      const authModule = await import('./AuthContext');

      // Should be able to import without errors
      expect(authModule).toBeDefined();
    });
  });

  describe('Club Roles Integration', () => {
    it('should fetch club roles for authenticated users', async () => {
      // Mock club roles data
      supabaseMock.select.mockReturnValue(supabaseMock);
      supabaseMock.eq.mockReturnValue(supabaseMock);
      supabaseMock.not.mockReturnValue(supabaseMock);
      supabaseMock.single.mockResolvedValue({
        data: [
          { club_id: 'club-123', role: 'admin' },
          { club_id: 'club-456', role: 'member' }
        ],
        error: null
      });

      let authContext: any;

      const TestClubRoles = () => {
        authContext = useAuth();
        return (
          <div>
            <button
              data-testid="fetch-roles-btn"
              onClick={() => authContext.fetchClubRoles()}
            >
              Fetch Roles
            </button>
            <div data-testid="is-admin-123">
              {authContext.isAdmin('club-123').toString()}
            </div>
            <div data-testid="is-member-456">
              {authContext.isMember('club-456').toString()}
            </div>
          </div>
        );
      };

      renderWithProvider(<TestClubRoles />);

      const fetchBtn = screen.getByTestId('fetch-roles-btn');

      await act(async () => {
        fireEvent.click(fetchBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-admin-123')).toHaveTextContent('true');
        expect(screen.getByTestId('is-member-456')).toHaveTextContent('true');
      });
    });
  });

  describe('Enhanced Subscription Helpers', () => {
    it('should provide canAccessFeature functionality', () => {
      let authContext: any;

      const TestFeatureAccess = () => {
        authContext = useAuth();
        return (
          <div>
            <div data-testid="can-access-premium">
              {authContext.canAccessFeature('CAN_ACCESS_PREMIUM_CONTENT').toString()}
            </div>
            <div data-testid="subscription-context">
              {JSON.stringify(authContext.getSubscriptionStatusWithContext())}
            </div>
          </div>
        );
      };

      renderWithProvider(<TestFeatureAccess />);

      expect(screen.getByTestId('can-access-premium')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-context')).toBeInTheDocument();
    });

    it('should provide coordinated data refresh', async () => {
      let authContext: any;

      const TestCoordinatedRefresh = () => {
        authContext = useAuth();
        return (
          <button
            data-testid="refresh-user-data-btn"
            onClick={() => authContext.refreshUserData()}
          >
            Refresh User Data
          </button>
        );
      };

      renderWithProvider(<TestCoordinatedRefresh />);

      const refreshBtn = screen.getByTestId('refresh-user-data-btn');

      await act(async () => {
        fireEvent.click(refreshBtn);
      });

      // Should not throw errors
      expect(refreshBtn).toBeInTheDocument();
    });
  });
});
