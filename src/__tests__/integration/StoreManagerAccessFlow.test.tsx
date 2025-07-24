/**
 * Integration test for complete Store Manager access flow
 * Tests login → role detection → store context → page access
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreManagerRouteGuard } from '@/components/routeguards/StoreManagerRouteGuard';
import StoreManagerLayout from '@/components/layouts/StoreManagerLayout';
import StoreManagerDashboardPage from '@/pages/store-manager/StoreManagerDashboardPage';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement } from '@/lib/entitlements/hooks';

// Mock dependencies
jest.mock('@/hooks/store-manager/useStoreManagerAccess');
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/entitlements/hooks');

const mockUseStoreManagerAccess = useStoreManagerAccess as jest.MockedFunction<typeof useStoreManagerAccess>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseHasEntitlement = useHasEntitlement as jest.MockedFunction<typeof useHasEntitlement>;

// Test component that simulates the complete Store Manager route structure
const StoreManagerTestApp = () => (
  <BrowserRouter>
    <StoreManagerRouteGuard>
      <StoreManagerLayout />
    </StoreManagerRouteGuard>
  </BrowserRouter>
);

describe('Store Manager Access Flow Integration', () => {
  const mockStoreManagerUser = {
    id: '192ea974-1770-4b03-9dba-cc8121525c57',
    email: 'kafka@bookconnect.com'
  };

  const mockStoreContext = {
    isStoreManager: true,
    storeId: 'ce76b99a-5f1a-481a-af85-862e584465e1',
    storeName: 'Default Store',
    loading: false,
    error: null,
    refetch: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication
    mockUseAuth.mockReturnValue({
      user: mockStoreManagerUser,
      loading: false,
      signOut: jest.fn()
    } as any);

    // Mock Store Manager entitlements
    mockUseHasEntitlement.mockImplementation((entitlement) => ({
      result: [
        'CAN_MANAGE_EVENTS',
        'CAN_VIEW_STORE_ANALYTICS', 
        'CAN_MODERATE_CONTENT'
      ].includes(entitlement)
    }));
  });

  describe('Complete Access Flow', () => {
    it('should complete full authentication to dashboard flow', async () => {
      // Mock successful Store Manager access
      mockUseStoreManagerAccess.mockReturnValue(mockStoreContext);

      render(<StoreManagerTestApp />);

      // Verify Store Manager Panel is displayed
      await waitFor(() => {
        expect(screen.getByText('Store Manager Panel')).toBeInTheDocument();
      });

      // Verify store context is displayed
      expect(screen.getByText('Default Store Management')).toBeInTheDocument();
      expect(screen.getByText('Managing: Default Store')).toBeInTheDocument();

      // Verify navigation items are present
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Clubs')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Moderation')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    it('should handle loading states during access verification', async () => {
      // Mock loading state
      mockUseStoreManagerAccess.mockReturnValue({
        ...mockStoreContext,
        loading: true
      });

      render(<StoreManagerTestApp />);

      // Verify loading message is displayed
      expect(screen.getByText('Verifying Store Manager access...')).toBeInTheDocument();
    });

    it('should handle access denied for non-Store Manager users', async () => {
      // Mock non-Store Manager user
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: false,
        storeId: null,
        storeName: null,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<StoreManagerTestApp />);

      // Should redirect (navigation will be handled by React Router in real app)
      // In test environment, we verify the component doesn't render Store Manager content
      expect(screen.queryByText('Store Manager Panel')).not.toBeInTheDocument();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: false,
        storeId: null,
        storeName: null,
        loading: false,
        error: 'Database connection failed',
        refetch: jest.fn()
      });

      render(<StoreManagerTestApp />);

      // Verify error message is displayed
      expect(screen.getByText(/Unable to verify Store Manager access/)).toBeInTheDocument();
    });
  });

  describe('Permission-Based Navigation', () => {
    it('should show all navigation items when user has all permissions', async () => {
      mockUseStoreManagerAccess.mockReturnValue(mockStoreContext);
      mockUseHasEntitlement.mockReturnValue({ result: true });

      render(<StoreManagerTestApp />);

      await waitFor(() => {
        expect(screen.getByText('Store Manager Panel')).toBeInTheDocument();
      });

      // All sections should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Clubs')).toBeInTheDocument();
      expect(screen.getByText('Moderation')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    it('should hide optional sections when user lacks permissions', async () => {
      mockUseStoreManagerAccess.mockReturnValue(mockStoreContext);
      mockUseHasEntitlement.mockReturnValue({ result: false });

      render(<StoreManagerTestApp />);

      await waitFor(() => {
        expect(screen.getByText('Store Manager Panel')).toBeInTheDocument();
      });

      // Core sections should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Clubs')).toBeInTheDocument();

      // Optional sections should be hidden
      expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
      expect(screen.queryByText('Moderation')).not.toBeInTheDocument();
      expect(screen.queryByText('Events')).not.toBeInTheDocument();
    });
  });

  describe('Store Context Integration', () => {
    it('should provide store context to child components', async () => {
      mockUseStoreManagerAccess.mockReturnValue(mockStoreContext);

      // Test with dashboard page to verify context provision
      render(
        <BrowserRouter>
          <StoreManagerRouteGuard>
            <StoreManagerDashboardPage />
          </StoreManagerRouteGuard>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Store Manager Dashboard')).toBeInTheDocument();
      });

      // Verify store context is available in child component
      expect(screen.getByText(/Managing Default Store/)).toBeInTheDocument();
      expect(screen.getByText(/Store ID: ce76b99a-5f1a-481a-af85-862e584465e1/)).toBeInTheDocument();
    });
  });
});
