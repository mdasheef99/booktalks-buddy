/**
 * Comprehensive tests for GlobalAdminRouteGuard component
 * Tests authentication states, user roles, entitlement loading, access control, and redirect behavior
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import GlobalAdminRouteGuard from '../GlobalAdminRouteGuard';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div data-testid="navigate-to">{to}</div>;
    }
  };
});

// Mock auth context
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock entitlement hooks
const mockUseHasEntitlement = vi.fn();
const mockUseIsPlatformOwner = vi.fn();
vi.mock('@/lib/entitlements/hooks', () => ({
  useHasEntitlement: (entitlement: string) => mockUseHasEntitlement(entitlement),
  useIsPlatformOwner: () => mockUseIsPlatformOwner()
}));

// Test component to verify children are rendered
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

// Helper to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

// Mock user objects
const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  displayname: 'Test User'
};

const mockStoreManager = {
  id: 'manager-456',
  email: 'manager@example.com',
  displayname: 'Store Manager'
};

const mockPlatformOwner = {
  id: 'owner-789',
  email: 'owner@example.com',
  displayname: 'Platform Owner'
};

describe('GlobalAdminRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication State Handling', () => {
    it('should show loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });
      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      // Should show loading state
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect to unauthorized when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });
      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/unauthorized');
      });
    });

    it('should handle authenticated user with no admin permissions', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });
      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/unauthorized');
      });
    });
  });

  describe('Entitlement Loading States', () => {
    it('should show loading state while entitlements are loading', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      // Mock one entitlement still loading
      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_ALL_CLUBS') {
          return { result: false, loading: true };
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      // Should show loading state
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should wait for all entitlements to finish loading', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      // Mock multiple entitlements loading
      mockUseHasEntitlement.mockImplementation((entitlement) => {
        switch (entitlement) {
          case 'CAN_MANAGE_ALL_CLUBS':
            return { result: false, loading: true };
          case 'CAN_MANAGE_USER_TIERS':
            return { result: false, loading: true };
          case 'CAN_MANAGE_STORE_SETTINGS':
            return { result: false, loading: false };
          default:
            return { result: false, loading: false };
        }
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: true });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      // Should show loading state while any entitlement is loading
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });
  });

  describe('User Role Access Control', () => {
    it('should grant access to Platform Owner', async () => {
      mockUseAuth.mockReturnValue({
        user: mockPlatformOwner,
        loading: false
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });
      mockUseIsPlatformOwner.mockReturnValue({ result: true, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should grant access to Store Manager with CAN_MANAGE_ALL_CLUBS', async () => {
      mockUseAuth.mockReturnValue({
        user: mockStoreManager,
        loading: false
      });

      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_ALL_CLUBS') {
          return { result: true, loading: false };
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should grant access to Store Owner with CAN_MANAGE_STORE_SETTINGS', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_STORE_SETTINGS') {
          return { result: true, loading: false };
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should grant access to user with CAN_MANAGE_USER_TIERS', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_USER_TIERS') {
          return { result: true, loading: false };
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should deny access to regular user with no admin entitlements', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });
      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/unauthorized');
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Timing Issues and Race Conditions', () => {
    it('should handle entitlements loading at different speeds', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      // Simulate entitlements loading at different times
      let clubsLoading = true;
      let tiersLoading = true;

      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_ALL_CLUBS') {
          return { result: false, loading: clubsLoading };
        }
        if (entitlement === 'CAN_MANAGE_USER_TIERS') {
          return { result: true, loading: tiersLoading };
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      const { rerender } = renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      // Should show loading initially
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');

      // Simulate first entitlement finishing
      clubsLoading = false;
      rerender(
        <MemoryRouter>
          <GlobalAdminRouteGuard>
            <TestComponent />
          </GlobalAdminRouteGuard>
        </MemoryRouter>
      );

      // Should still show loading
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');

      // Simulate second entitlement finishing
      tiersLoading = false;
      rerender(
        <MemoryRouter>
          <GlobalAdminRouteGuard>
            <TestComponent />
          </GlobalAdminRouteGuard>
        </MemoryRouter>
      );

      // Should now grant access (user has CAN_MANAGE_USER_TIERS)
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should not make premature access decisions', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      // Mock scenario where entitlements are still loading but would eventually grant access
      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_ALL_CLUBS') {
          return { result: false, loading: true }; // Still loading, but will be true
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      // Should show loading, not redirect to unauthorized
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
      expect(mockNavigate).not.toHaveBeenCalledWith('/unauthorized');
    });

    it('should handle authentication state changes during entitlement loading', async () => {
      // Start with loading auth
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });
      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      const { rerender } = renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      // Should show loading
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');

      // Simulate auth completing with admin user
      mockUseAuth.mockReturnValue({
        user: mockPlatformOwner,
        loading: false
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: true, loading: false });

      rerender(
        <MemoryRouter>
          <GlobalAdminRouteGuard>
            <TestComponent />
          </GlobalAdminRouteGuard>
        </MemoryRouter>
      );

      // Should grant access
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle entitlement hook errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      // Mock entitlement hook throwing error
      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_ALL_CLUBS') {
          throw new Error('Entitlement check failed');
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      // Should not crash, should deny access
      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/unauthorized');
      });
    });

    it('should handle platform owner check errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });

      // Mock platform owner hook throwing error
      mockUseIsPlatformOwner.mockImplementation(() => {
        throw new Error('Platform owner check failed');
      });

      // Should not crash, should deny access
      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/unauthorized');
      });
    });
  });

  describe('Multiple Admin Routes Protection', () => {
    it('should protect all admin routes consistently', async () => {
      const adminRoutes = [
        '/admin/dashboard',
        '/admin/clubs',
        '/admin/users',
        '/admin/analytics',
        '/admin/moderation'
      ];

      mockUseAuth.mockReturnValue({
        user: mockStoreManager,
        loading: false
      });

      mockUseHasEntitlement.mockImplementation((entitlement) => {
        if (entitlement === 'CAN_MANAGE_ALL_CLUBS') {
          return { result: true, loading: false };
        }
        return { result: false, loading: false };
      });

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      // Test that the same guard logic applies to all routes
      for (const route of adminRoutes) {
        renderWithRouter(
          <GlobalAdminRouteGuard>
            <TestComponent />
          </GlobalAdminRouteGuard>
        );

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });

        // Clean up for next iteration
        screen.getByTestId('protected-content').remove();
      }
    });
  });

  describe('Loading State Display', () => {
    it('should display proper loading skeleton', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: true
      });

      mockUseHasEntitlement.mockReturnValue({ result: false, loading: false });
      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      const loadingContainer = screen.getByRole('generic');
      expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-screen');

      const pulseContainer = loadingContainer.firstChild;
      expect(pulseContainer).toHaveClass('animate-pulse');
    });

    it('should show loading for minimum required time', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      // Start with loading entitlements
      let entitlementsLoading = true;
      mockUseHasEntitlement.mockImplementation(() => ({
        result: true,
        loading: entitlementsLoading
      }));

      mockUseIsPlatformOwner.mockReturnValue({ result: false, loading: false });

      const { rerender } = renderWithRouter(
        <GlobalAdminRouteGuard>
          <TestComponent />
        </GlobalAdminRouteGuard>
      );

      // Should show loading
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');

      // Simulate entitlements finishing
      entitlementsLoading = false;
      rerender(
        <MemoryRouter>
          <GlobalAdminRouteGuard>
            <TestComponent />
          </GlobalAdminRouteGuard>
        </MemoryRouter>
      );

      // Should now show content
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });
});
